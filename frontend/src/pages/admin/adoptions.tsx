import { Container } from "@/components/ui";
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui";
import { MoreHorizontalIcon } from "lucide-react";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import axios from "axios";
import { formatAdoptionStatus, styleAdoptionStatus } from "@/lib/utils";
import { Label } from "@/components/ui";
import type { Adoption } from "@/types/adoption";
import { MultiValueSelector } from "@/components/shared";
import { adoptionStatusOptions } from "@/constants/adoption.constants";

const AdminAdoptionsPage = () => {
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>([
    "OCZEKUJACA",
  ]);

  useEffect(() => {
    const fetchAdoptions = async () => {
      try {
        const res = await axios.get("/api/adoptions");
        setAdoptions(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAdoptions();
  }, []);

  const filteredAdoptions = useMemo(() => {
    return adoptions.filter((adoption) => {
      const matchesStatus =
        selectedStatutes.length === 0 ||
        selectedStatutes.includes(adoption.status);

      return matchesStatus;
    });
  }, [adoptions, selectedStatutes]);

  const resetFilters = () => {
    setSelectedStatutes([]);
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Zarządzaj adopcjami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszystkie adopcje użytkowników.
            </p>
          </div>
          <DashboardNavbar />
        </section>

        <section id="table">
          <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
            <div className="flex flex-row gap-x-2">
              <Label>Wyszukaj po statusie</Label>
              <MultiValueSelector
                items={adoptionStatusOptions}
                placeholder="Status"
                value={selectedStatutes}
                onValueChange={setSelectedStatutes}
              />
            </div>

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>
          </div>

          <Table>
            <TableCaption>Lista adopcji w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Zwierzę</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wiadomość użytkownika</TableHead>
                <TableHead>Wiadomość pracownika</TableHead>
                <TableHead className="text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAdoptions.map((adoption) => (
                <TableRow key={adoption.id}>
                  <TableCell>{adoption.user.fullName}</TableCell>
                  <TableCell>{adoption.animal.name}</TableCell>
                  <TableCell>
                    <span
                      className={`${styleAdoptionStatus(adoption.status)} rounded-2xl px-4 py-2 text-xs`}
                    >
                      {formatAdoptionStatus[adoption.status]}
                    </span>
                  </TableCell>
                  <TableCell>{adoption.message?.slice(0, 30)}...</TableCell>
                  <TableCell>
                    {adoption.employeeNote?.slice(0, 30)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="transparent" size="icon">
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <a href={`/pracownik/adopcje/${adoption.id}/edycja`}>
                            Szczegóły
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>Suma adopcji</TableCell>
                <TableCell className="text-right">
                  {filteredAdoptions.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </Container>
    </main>
  );
};

export default AdminAdoptionsPage;
