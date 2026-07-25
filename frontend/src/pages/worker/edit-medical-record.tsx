"use client";

import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Container,
  Input,
  Label,
  Textarea,
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { formatAnimalType } from "@/lib/utils";
import type { LabelValueType } from "@/types/common";
import {
  medicalRecordSchema,
  type MedicalRecordFormData,
} from "@/schemas/medical-record.schema";
import {
  medicalRecordTypeOptions,
  medicalRecordStatusOptions,
} from "@/constants/medical-record.constants";

type OptionSelectorProps = {
  options: LabelValueType[];
  placeholder: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  hasError?: boolean;
};

const OptionSelector = ({
  options,
  placeholder,
  value,
  onValueChange,
  hasError,
}: OptionSelectorProps) => {
  const labels = options.map((option) => option.label);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? null;

  return (
    <Combobox
      items={labels}
      value={selectedLabel}
      onValueChange={(label) => {
        const option = options.find((item) => item.label === label);
        onValueChange(option?.value ?? null);
      }}
    >
      <ComboboxChips className={hasError ? "bg-red-600/20" : undefined}>
        <ComboboxChipsInput
          placeholder={placeholder}
          className="placeholder:text-muted-foreground py-1 text-sm lg:text-base"
        />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>Brak dostępnych opcji</ComboboxEmpty>
        <ComboboxList>
          {options.map((option) => (
            <ComboboxItem key={option.value} value={option.label}>
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

type Vet = {
  id: number;
  name: string;
  clinic: string | null;
};

type Animal = {
  id: number;
  name: string;
  type: string;
};

type MedicalRecord = {
  id: number;
  vetId: number;
  animalId: number;
  type: MedicalRecordFormData["type"];
  description: string;
  date: string;
  cost: number;
  status: MedicalRecordFormData["status"];
};

const EditMedicalRecordPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vets, setVets] = useState<Vet[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      vetId: 0,
      animalId: 0,
      type: "WIZYTA",
      description: "",
      date: new Date().toISOString().split("T")[0],
      cost: undefined as unknown as number,
      status: "DO_REALIZACJI",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vetsRes, animalsRes, recordRes] = await Promise.all([
          axios.get<Vet[]>("/api/vets", { withCredentials: true }),
          axios.get<Animal[]>("/api/animals", { withCredentials: true }),
          axios.get<MedicalRecord>(`/api/medical-records/${id}`, {
            withCredentials: true,
          }),
        ]);

        setVets(vetsRes.data);
        setAnimals(animalsRes.data);

        const data = recordRes.data;

        reset({
          vetId: data.vetId,
          animalId: data.animalId,
          type: data.type,
          description: data.description,
          date: new Date(data.date).toISOString().split("T")[0],
          cost: data.cost,
          status: data.status,
        });
      } catch {
        toast.error("Nie udało się pobrać danych raportu medycznego.");
        navigate("/pracownik/raporty-medyczne");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, reset, navigate]);

  const vetOptions = useMemo<LabelValueType[]>(
    () =>
      vets.map((vet) => ({
        value: String(vet.id),
        label: vet.clinic ?? vet.name,
      })),
    [vets],
  );

  const animalOptions = useMemo<LabelValueType[]>(
    () =>
      animals.map((animal) => ({
        value: String(animal.id),
        label: `#${animal.id} ${animal.name} (${formatAnimalType[animal.type] ?? animal.type})`,
      })),
    [animals],
  );

  const typeOptions = medicalRecordTypeOptions;
  const statusOptions = medicalRecordStatusOptions;

  const onSubmit = async (data: MedicalRecordFormData) => {
    try {
      await axios.patch(`/api/medical-records/${id}`, data, {
        withCredentials: true,
      });

      toast.success("Raport medyczny został zaktualizowany.");
      navigate("/pracownik/raporty-medyczne");
    } catch {
      toast.error("Nie udało się zaktualizować raportu medycznego.");
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
            Edytuj raport medyczny
          </h1>
          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            Zaktualizuj dane raportu medycznego poniżej. Pamiętaj, aby zapisać
            po zakończeniu.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Klinika</Label>
              <Controller
                name="vetId"
                control={control}
                render={({ field }) => (
                  <OptionSelector
                    options={vetOptions}
                    placeholder={
                      isLoading ? "Ładowanie klinik..." : "Wybierz klinikę"
                    }
                    value={field.value > 0 ? String(field.value) : null}
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : 0)
                    }
                    hasError={!!errors.vetId}
                  />
                )}
              />
              {errors.vetId && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.vetId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Zwierzę</Label>
              <Controller
                name="animalId"
                control={control}
                render={({ field }) => (
                  <OptionSelector
                    options={animalOptions}
                    placeholder={
                      isLoading ? "Ładowanie zwierząt..." : "Wybierz zwierzę"
                    }
                    value={field.value > 0 ? String(field.value) : null}
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : 0)
                    }
                    hasError={!!errors.animalId}
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
              <Label>Typ raportu</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <OptionSelector
                    options={typeOptions}
                    placeholder="Wybierz typ raportu"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "WIZYTA")}
                    hasError={!!errors.type}
                  />
                )}
              />
              {errors.type && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <OptionSelector
                    options={statusOptions}
                    placeholder="Wybierz status"
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value ?? "DO_REALIZACJI")
                    }
                    hasError={!!errors.status}
                  />
                )}
              />
              {errors.status && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data wizyty</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                className={errors.date ? "bg-red-600/20" : undefined}
              />
              {errors.date && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Koszt (PLN)</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                step="0.01"
                {...register("cost")}
                className={errors.cost ? "bg-red-600/20" : undefined}
              />
              {errors.cost && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.cost.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Opis raportu</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Napisz coś więcej o raporcie medycznym..."
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
            disabled={isSubmitting || isLoading}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </Container>
    </main>
  );
};

export default EditMedicalRecordPage;
