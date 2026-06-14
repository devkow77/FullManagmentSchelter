import {
  Container,
  Input,
  Label,
  Button,
  DeleteVetDialog,
} from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
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
import { MoreHorizontalIcon } from "lucide-react";
import axios from "axios";
import { Link } from "react-router";
import { toast } from "sonner";
import { MultiValueSelector } from "@/components/shared";
import type { Vet } from "@/types/vet";

const AdminVetsPage = () => {
  const [vets, setVets] = useState<Vet[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);

  const clinicOptions = useMemo(() => {
    const clinics = [
      ...new Set(vets.map((v) => v.clinic).filter(Boolean)),
    ] as string[];
    return clinics.map((clinic) => ({ label: clinic, value: clinic }));
  }, [vets]);

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const res = await axios.get("/api/vets");
        setVets(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVets();
  }, []);

  const filteredVets = useMemo(() => {
    return vets.filter((vet) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery.trim() === "" ||
        vet.name.toLowerCase().includes(query) ||
        (vet.clinic?.toLowerCase().includes(query) ?? false) ||
        (vet.phone?.toLowerCase().includes(query) ?? false);

      const matchesClinic =
        selectedClinics.length === 0 ||
        (vet.clinic !== null && selectedClinics.includes(vet.clinic));

      return matchesSearch && matchesClinic;
    });
  }, [vets, searchQuery, selectedClinics]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedClinics([]);
  };

  const handleDeleteVet = async (id: number) => {
    try {
      await axios.delete(`/api/vets/${id}`, { withCredentials: true });
      setVets((prev) => prev.filter((vet) => vet.id !== id));
      toast.success("Pomyślnie usunięto weterynarza!");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się usunąć weterynarza.");
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Zarządzaj weterynarzami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszyscy weterynarze współpracujący ze
              schroniskiem.
            </p>
          </div>
          <DashboardNavbar />
        </section>
        <section id="table">
          <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
            <div className="flex flex-row gap-x-2">
              <Label>Wyszukaj</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po imieniu, klinice lub telefonie..."
                className="h-7.5 placeholder:text-sm"
              />
            </div>

            <MultiValueSelector
              items={clinicOptions}
              placeholder="Klinika"
              value={selectedClinics}
              onValueChange={setSelectedClinics}
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>

            <Button variant="success">
              <a href="/admin/weterynarze/dodaj">Dodaj weterynarza</a>
            </Button>
          </div>

          <Table>
            <TableCaption>
              Lista weterynarzy współpracujących ze schroniskiem
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Klinika</TableHead>
                <TableHead>Telefon</TableHead>

                <TableHead className="text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVets.map((vet) => (
                <TableRow key={vet.id}>
                  <TableCell className="font-medium">{vet.name}</TableCell>
                  <TableCell>{vet.clinic}</TableCell>
                  <TableCell>
                    {vet.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="transparent"
                          size="icon"
                          className="size-8"
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/admin/weterynarze/${vet.id}/edycja`}
                            state={{ returnTo: "/admin/weterynarze" }}
                          >
                            Edytuj dane
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteVetDialog
                          vetId={vet.id}
                          onConfirm={handleDeleteVet}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Suma weterynarzy</TableCell>
                <TableCell className="text-right">
                  {filteredVets.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </Container>
    </main>
  );
};

export default AdminVetsPage;
