import { Container, DeleteMedicalRecordDialog } from "@/components/ui";
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button, Input } from "@/components/ui";
import { MoreHorizontalIcon } from "lucide-react";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import axios from "axios";
import { Label } from "@/components/ui";
import {
  styleMedicalRecordStatus,
  styleMedicalRecordType,
  formatMedicalRecordStatus,
  formatMedicalRecordType,
  formatAnimalType,
} from "@/lib/utils";
import { MultiValueSelector } from "@/components/shared";
import type { MedicalRecord } from "@/types/medical-record";
import {
  medicalRecordAnimalTypeOptions,
  medicalRecordTypeOptions,
  medicalRecordStatusOptions,
} from "@/constants/medical-record.constants";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const MedicalRecordsPage = () => {
  const { user } = useAuth();

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [searchClinicName, setSearchClinicName] = useState<string>("");
  const [selectedAnimalType, setSelectedAnimalType] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        const res = await axios.get("/api/medical-records");
        setMedicalRecords(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMedicalRecords();
  }, []);

  const filteredMedicalRecords = useMemo(() => {
    return medicalRecords.filter((medicalRecord) => {
      const matchesSearch =
        searchClinicName.trim() === "" ||
        medicalRecord.vet.clinic
          .toLowerCase()
          .includes(searchClinicName.toLowerCase());

      const matchesAnimalType =
        selectedAnimalType.length === 0 ||
        selectedAnimalType.includes(medicalRecord.animal.type);

      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.includes(medicalRecord.type);

      const matchesStatus =
        selectedStatus.length === 0 ||
        selectedStatus.includes(medicalRecord.status);

      return matchesSearch && matchesAnimalType && matchesType && matchesStatus;
    });
  }, [
    medicalRecords,
    searchClinicName,
    selectedAnimalType,
    selectedTypes,
    selectedStatus,
  ]);

  const handleDeleteMedicalRecord = async (id: number) => {
    try {
      await axios.delete(`/api/medical-records/${id}`);
      setMedicalRecords(
        medicalRecords.filter((medicalRecord) => medicalRecord.id !== id),
      );
      toast.success("Pomyślnie usunięto raport medyczny!");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.msg);
      } else {
        toast.error("Wystąpił błąd podczas usuwania raportu medycznego!");
      }
    }
  };

  const resetFilters = () => {
    setSearchClinicName("");
    setSelectedAnimalType([]);
    setSelectedTypes([]);
    setSelectedStatus([]);
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Raporty medyczne
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszystkie raporty medyczne zwierząt w
              schronisku.
            </p>
          </div>
          <DashboardNavbar />
        </section>

        <section id="table">
          <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
            <div className="flex flex-row gap-x-2">
              <Label>Wyszukaj</Label>
              <Input
                value={searchClinicName}
                onChange={(e) => setSearchClinicName(e.target.value)}
                placeholder="Podaj nazwę kliniki..."
                className="h-7.5 placeholder:text-sm"
              />
            </div>

            <MultiValueSelector
              items={medicalRecordAnimalTypeOptions}
              placeholder="Gatunek zwierzęcia"
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
              placeholder="Status realizacji"
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>

            <Button variant="success">
              <a href="/pracownik/raporty-medyczne/dodaj">Dodaj raport</a>
            </Button>
          </div>

          <Table>
            <TableCaption>Lista raportów medycznych w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Weterynarz</TableHead>
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
              {filteredMedicalRecords.map((medicalRecord) => (
                <TableRow key={medicalRecord.id}>
                  <TableCell>
                    <span className="font-medium">
                      {medicalRecord.vet.name}
                    </span>{" "}
                    <br />
                    {medicalRecord.vet.clinic}
                  </TableCell>
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
                    {new Date(medicalRecord.date).toLocaleDateString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    r.
                  </TableCell>
                  <TableCell>{medicalRecord.cost} zł</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="transparent" size="icon">
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <a
                            href={`/pracownik/raporty-medyczne/${medicalRecord.id}/edycja`}
                          >
                            Szczegóły
                          </a>
                        </DropdownMenuItem>
                        {user?.role === "ADMINISTRATOR" && (
                          <>
                            <DropdownMenuSeparator />
                            <DeleteMedicalRecordDialog
                              medicalRecordId={medicalRecord.id}
                              onConfirm={(id) => handleDeleteMedicalRecord(id)}
                            />
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>Suma raportów</TableCell>
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

export default MedicalRecordsPage;
