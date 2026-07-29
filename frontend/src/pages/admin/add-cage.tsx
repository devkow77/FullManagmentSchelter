import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Container, Input, Label } from "@/components/ui";
import axios from "axios";
import { SingleValueSelector } from "@/components/shared";

const cageSchema = z.object({
  zone: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/, "Strefa musi być jedną literą (np. A, B, C).")
    .transform((value) => value.toUpperCase()),
  number: z.coerce
    .number({ message: "Numer klatki jest wymagany." })
    .int("Numer klatki musi być liczbą całkowitą.")
    .min(1, "Numer klatki musi być co najmniej 1.")
    .max(99, "Numer klatki może mieć maksymalnie 2 cyfry."),
});

type CageFormInput = z.input<typeof cageSchema>;
type CageFormData = z.output<typeof cageSchema>;

type CageOptionsResponse = {
  zones: string[];
  numbers: number[];
  byZone: Record<string, number[]>;
};

const formatCageNumber = (value: number) => String(value).padStart(2, "0");

const formatNumberRanges = (numbers: number[]) => {
  if (numbers.length === 0) return "brak";

  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }

    ranges.push(
      start === prev
        ? formatCageNumber(start)
        : `${formatCageNumber(start)}–${formatCageNumber(prev)}`,
    );
    start = current;
    prev = current;
  }

  return ranges.join(", ");
};

const getNextFreeNumber = (numbers: number[]) => {
  const taken = new Set(numbers);
  for (let i = 1; i <= 99; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
};

const getCageOptions = async () => {
  const res = await axios.get<CageOptionsResponse>("/api/cages/options", {
    withCredentials: true,
  });
  return res.data;
};

const AddCagePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cageOptions } = useQuery({
    queryKey: ["cages", "options"],
    queryFn: getCageOptions,
  });

  const zoneItems = useMemo(() => {
    const zones = cageOptions?.zones ?? [];
    return zones.length > 0 ? zones : ["A"];
  }, [cageOptions?.zones]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CageFormInput, unknown, CageFormData>({
    resolver: zodResolver(cageSchema),
    defaultValues: {
      zone: "A",
      number: 1,
    },
  });

  const selectedZone = (watch("zone") ?? "A").toString().toUpperCase();
  const selectedZoneNumbers = cageOptions?.byZone?.[selectedZone] ?? [];
  const nextFreeNumber = getNextFreeNumber(selectedZoneNumbers);

  const onSubmit = async (data: CageFormData) => {
    try {
      await axios.post("/api/cages", data, { withCredentials: true });
      void queryClient.invalidateQueries({ queryKey: ["cages", "options"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-cages"] });
      toast.success("Pomyślnie dodano klatkę!");
      navigate("/admin/klatki");
    } catch (err) {
      console.error(err);
      const message =
        axios.isAxiosError(err) && err.response?.data?.msg
          ? String(err.response.data.msg)
          : "Nie udało się dodać klatki.";
      toast.error(message);
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Dodaj klatkę
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Utwórz nową klatkę, podając strefę i numer.
            </p>
          </div>
        </section>

        <section id="form" className="space-y-6">
          {cageOptions?.byZone && (
            <div className="max-w-xl space-y-1 text-sm leading-6 font-medium md:text-base md:leading-7">
              <p>Istniejące klatki w strefach:</p>
              <ul className="space-y-1">
                {Object.entries(cageOptions.byZone).map(([zone, numbers]) => (
                  <li key={zone}>
                    Strefa {zone}: {formatNumberRanges(numbers)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label>Strefa</Label>
              <Controller
                name="zone"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={zoneItems}
                    placeholder="Wybierz strefę"
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value?.toUpperCase() ?? "A")
                    }
                  />
                )}
              />
              {errors.zone && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.zone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Numer klatki</Label>
              <Input
                id="number"
                type="number"
                min={1}
                max={99}
                {...register("number")}
                className={errors.number && "bg-red-600/20"}
              />
              {errors.number && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.number.message}
                </p>
              )}
            </div>

            <p className="text-sm leading-6 font-medium sm:col-span-2 md:text-base md:leading-7">
              {selectedZoneNumbers.length > 0 ? (
                <>
                  W strefie {selectedZone} są już numery:{" "}
                  {formatNumberRanges(selectedZoneNumbers)}.
                  {nextFreeNumber !== null && (
                    <>
                      {" "}
                      Najniższy wolny numer: {formatCageNumber(nextFreeNumber)}.
                    </>
                  )}
                </>
              ) : (
                <>
                  Strefa {selectedZone} nie ma jeszcze żadnych klatek — możesz
                  zacząć od numeru 01.
                </>
              )}
            </p>

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" variant="success" disabled={isSubmitting}>
                {isSubmitting ? "Dodawanie..." : "Dodaj klatkę"}
              </Button>
            </div>
          </form>
        </section>
      </Container>
    </main>
  );
};

export default AddCagePage;
