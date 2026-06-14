import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Container, Input, Label } from "@/components/ui";
import axios from "axios";
import { vetSchema, type VetFormData } from "@/schemas/vet.schema";
import type { Vet } from "@/types/vet";

const EditVetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      </Container>
    </main>
  );
};

export default EditVetPage;
