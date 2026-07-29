import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Button,
  Container,
  DeleteMedicalRecordDialog,
  Input,
  Label,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import axios from "axios";
import { vetSchema, type VetFormData } from "@/schemas/vet.schema";
import type { Vet } from "@/types/vet";
import type { MedicalRecord } from "@/types/medical-record";
import {
  styleMedicalRecordStatus,
  styleMedicalRecordType,
  formatMedicalRecordStatus,
  formatMedicalRecordType,
  formatAnimalType,
} from "@/lib/utils";
import { MultiValueSelector, TableRowActions } from "@/components/shared";
import {
  medicalRecordAnimalTypeOptions,
  medicalRecordTypeOptions,
  medicalRecordStatusOptions,
} from "@/constants/medical-record.constants";

const EditVetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [selectedAnimalType, setSelectedAnimalType] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VetFormData>({
    resolver: zodResolver(vetSchema),
    defaultValues: {
      name: "",
      phone: "",
      clinic: "",
    },
  });

  useEffect(() => {
    const fetchVet = async () => {
      try {
        const res = await axios.get<Vet>(`/api/vets/${id}`, {
          withCredentials: true,
        });

        reset({
          name: res.data.name,
          phone: res.data.phone,
          clinic: res.data.clinic,
        });
      } catch {
        toast.error("Nie udało się pobrać danych weterynarza.");
        navigate("/admin/weterynarze");
      }
    };

    if (id) fetchVet();
  }, [id, reset, navigate]);

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        const res = await axios.get<MedicalRecord[]>(
          `/api/medical-records?vetId=${id}`,
        );
        setMedicalRecords(res.data);
      } catch {
        toast.error("Nie udało się pobrać raportów medycznych weterynarza.");
      }
    };

    if (id) fetchMedicalRecords();
  }, [id]);

  const filteredMedicalRecords = useMemo(() => {
    return medicalRecords.filter((medicalRecord) => {
      const matchesAnimalType =
        selectedAnimalType.length === 0 ||
        selectedAnimalType.includes(medicalRecord.animal.type);

      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.includes(medicalRecord.type);

      const matchesStatus =
        selectedStatus.length === 0 ||
        selectedStatus.includes(medicalRecord.status);

      return matchesAnimalType && matchesType && matchesStatus;
    });
  }, [medicalRecords, selectedAnimalType, selectedTypes, selectedStatus]);

  const resetFilters = () => {
    setSelectedAnimalType([]);
    setSelectedTypes([]);
    setSelectedStatus([]);
  };

  const handleDeleteMedicalRecord = async (recordId: number) => {
    try {
      await axios.delete(`/api/medical-records/${recordId}`);
      setMedicalRecords((prev) =>
        prev.filter((record) => record.id !== recordId),
      );
      toast.success("Pomyślnie usunięto raport medyczny!");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.msg);
      } else {
        toast.error("Wystąpił błąd podczas usuwania raportu medycznego!");
      }
    }
  };

  const onSubmit = async (data: VetFormData) => {
    try {
      await axios.patch(`/api/vets/${id}`, data, { withCredentials: true });

      toast.success("Dane weterynarza zostały zaktualizowane!");
      navigate("/admin/weterynarze");
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.msg || "Wystąpił błąd podczas zapisywania.",
        );
        return;
      }

      toast.error("Wystąpił błąd podczas zapisywania.");
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
            Edytuj dane weterynarza
          </h1>
          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            Wprowadź zmiany w danych weterynarza poniżej. Pamiętaj, aby zapisać
            po zakończeniu edycji.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="np. dr Anna Kowalczyk"
                className={errors.name ? "bg-red-600/20" : ""}
              />
              {errors.name && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="np. 17 123 45 67"
                className={errors.phone ? "bg-red-600/20" : ""}
              />
              {errors.phone && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="clinic">Klinika</Label>
              <Input
                id="clinic"
                {...register("clinic")}
                placeholder="np. Przychodnia Weterynaryjna „Azyl” Rzeszów"
                className={errors.clinic ? "bg-red-600/20" : ""}
              />
              {errors.clinic && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.clinic.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Zaktualizuj dane weterynarza"}
          </Button>
        </form>

        <section id="medical-records" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-3xl">
              Raporty medyczne
            </h2>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Lista raportów medycznych przypisanych do tego weterynarza.
            </p>
          </div>

          <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
            <MultiValueSelector
              items={medicalRecordAnimalTypeOptions}
              placeholder="Gatunek"
              value={selectedAnimalType}
              onValueChange={setSelectedAnimalType}
            />

            <MultiValueSelector
              items={medicalRecordTypeOptions}
              placeholder="Typ raportu"
              value={selectedTypes}
              onValueChange={setSelectedTypes}
            />

            <MultiValueSelector
              items={medicalRecordStatusOptions}
              placeholder="Status"
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>
          </div>

          <Table>
            <TableCaption>Raporty medyczne weterynarza</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Zwierzę</TableHead>
                <TableHead>Gatunek</TableHead>
                <TableHead>Typ raportu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data wizyty</TableHead>
                <TableHead>Koszt</TableHead>
                <TableHead className="text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMedicalRecords.length ? (
                filteredMedicalRecords.map((medicalRecord) => (
                  <TableRow
                    key={medicalRecord.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/pracownik/raporty-medyczne/${medicalRecord.id}/edycja`,
                      )
                    }
                  >
                    <TableCell>{medicalRecord.animal.name}</TableCell>
                    <TableCell>
                      {formatAnimalType[medicalRecord.animal.type]}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${styleMedicalRecordType(medicalRecord.type)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatMedicalRecordType[medicalRecord.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${styleMedicalRecordStatus(medicalRecord.status)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatMedicalRecordStatus[medicalRecord.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(medicalRecord.date).toLocaleDateString(
                        "pl-PL",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )}{" "}
                      r.
                    </TableCell>
                    <TableCell>{medicalRecord.cost} zł</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableRowActions
                        editTo={`/pracownik/raporty-medyczne/${medicalRecord.id}/edycja`}
                        editLabel="Szczegóły"
                        deleteSlot={
                          <DeleteMedicalRecordDialog
                            medicalRecordId={medicalRecord.id}
                            onConfirm={(recordId) =>
                              handleDeleteMedicalRecord(recordId)
                            }
                          />
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-5 text-center font-medium"
                  >
                    Brak raportów spełniających wybrane filtry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>Suma raportów</TableCell>
                <TableCell className="text-right">
                  {filteredMedicalRecords.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </Container>
    </main>
  );
};

export default EditVetPage;
