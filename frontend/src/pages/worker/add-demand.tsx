"use client";

import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { formatAnimalType } from "@/lib/utils";
import type { LabelValueType } from "@/types/common";
import { SingleValueSelector, DashboardPage } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";

type Animal = {
  id: number;
  name: string;
  type: string;
};

const categoryOptions: LabelValueType[] = [
  { value: "JEDZENIE", label: "Jedzenie / karma" },
  { value: "LEKI", label: "Leki" },
  { value: "WYPOSAZENIE", label: "Wyposażenie" },
  { value: "OPIEKA", label: "Specjalna opieka" },
  { value: "INNE", label: "Inne" },
];

type DemandFormData = {
  animalId: number;
  category: string;
  name: string;
  description: string;
};

const AddDemandPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DemandFormData>({
    defaultValues: {
      animalId: 0,
      category: "INNE",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get<Animal[]>("/api/animals", {
          withCredentials: true,
        });
        setAnimals(res.data);
      } catch {
        toast.error("Nie udało się pobrać listy zwierząt.");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const animalOptions = useMemo<LabelValueType[]>(
    () =>
      animals.map((animal) => ({
        value: String(animal.id),
        label: `#${animal.id} ${animal.name} (${formatAnimalType[animal.type] ?? animal.type})`,
      })),
    [animals],
  );

  const onSubmit = async (data: DemandFormData) => {
    try {
      await axios.post("/api/animal-needs", data, {
        withCredentials: true,
      });

      toast.success("Zapotrzebowanie zostało dodane.");
      navigate("/pracownik/zapotrzebowania-zwierzat");
    } catch {
      toast.error("Nie udało się dodać zapotrzebowania.");
    }
  };

  return (
    <DashboardPage
      title="Dodaj zapotrzebowanie"
      description="Wprowadź wszystkie dane zapotrzebowania poniżej. Pamiętaj, aby zapisać po zakończeniu."
      showNavbar={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Zgłaszający</Label>
              <Input
                value={user?.fullName ?? ""}
                disabled
                className="disabled:opacity-70"
              />
            </div>

            <div className="space-y-2">
              <Label required>Zwierzę</Label>
              <Controller
                name="animalId"
                control={control}
                rules={{
                  validate: (value) =>
                    value && value > 0 ? true : "Wybierz zwierzę.",
                }}
                render={({ field }) => (
                  <SingleValueSelector
                    items={animalOptions}
                    placeholder={
                      isLoadingOptions
                        ? "Ładowanie zwierząt..."
                        : "Wybierz zwierzę"
                    }
                    value={field.value > 0 ? String(field.value) : null}
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : 0)
                    }
                    className={errors.animalId ? "bg-red-600/20" : undefined}
                  />
                )}
              />
              {errors.animalId && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.animalId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label required>Kategoria</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={categoryOptions}
                    placeholder="Wybierz kategorię"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "INNE")}
                    className={errors.category ? "bg-red-600/20" : undefined}
                  />
                )}
              />
              {errors.category && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" required>Nazwa (rzecz)</Label>
              <Input
                id="name"
                {...register("name", {
                  required: "Podaj nazwę zapotrzebowania.",
                })}
                placeholder="np. Karma hipoalergiczna"
                className={errors.name ? "bg-red-600/20" : undefined}
              />
              {errors.name && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description" required>Opis z powodem</Label>
              <Textarea
                id="description"
                {...register("description", {
                  required: "Powód jest wymagany.",
                  minLength: {
                    value: 20,
                    message: "Opis musi mieć co najmniej 20 znaków.",
                  },
                  maxLength: {
                    value: 200,
                    message: "Opis może mieć maksymalnie 200 znaków.",
                  },
                })}
                maxLength={200}
                placeholder="Opisz dlaczego potrzebne jest to zapotrzebowanie..."
                className={`h-40 resize-none ${errors.description ? "bg-red-600/20" : ""}`}
              />
              {errors.description && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting || isLoadingOptions}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Dodawanie..." : "Dodaj zapotrzebowanie"}
          </Button>
        </form>
    </DashboardPage>
  );
};

export default AddDemandPage;
