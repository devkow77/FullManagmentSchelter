"use client";

import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { formatAnimalType } from "@/lib/utils";
import type { LabelValueType } from "@/types/common";
import { SingleValueSelector, DashboardPage } from "@/components/shared";
import {
  medicalRecordSchema,
  type MedicalRecordFormData,
} from "@/schemas/medical-record.schema";
import {
  medicalRecordTypeOptions,
  medicalRecordStatusOptions,
} from "@/constants/medical-record.constants";

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
    <DashboardPage
      title="Edytuj raport medyczny"
      description="Zaktualizuj dane raportu medycznego poniżej. Pamiętaj, aby zapisać po zakończeniu."
      showNavbar={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Klinika</Label>
              <Controller
                name="vetId"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={vetOptions}
                    placeholder={
                      isLoading ? "Ładowanie klinik..." : "Wybierz klinikę"
                    }
                    value={field.value > 0 ? String(field.value) : null}
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : 0)
                    }
                    className={errors.vetId ? "bg-red-600/20" : undefined}
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
                  <SingleValueSelector
                    items={animalOptions}
                    placeholder={
                      isLoading ? "Ładowanie zwierząt..." : "Wybierz zwierzę"
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
              <Label>Typ raportu</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={typeOptions}
                    placeholder="Wybierz typ raportu"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "WIZYTA")}
                    className={errors.type ? "bg-red-600/20" : undefined}
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
                  <SingleValueSelector
                    items={statusOptions}
                    placeholder="Wybierz status"
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value ?? "DO_REALIZACJI")
                    }
                    className={errors.status ? "bg-red-600/20" : undefined}
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
    </DashboardPage>
  );
};

export default EditMedicalRecordPage;
