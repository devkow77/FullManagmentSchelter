import { toast } from "sonner";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Input, Label } from "@/components/ui";
import axios from "axios";
import { vetSchema, type VetFormData } from "@/schemas/vet.schema";
import { DashboardPage } from "@/components/shared";

const AddVetPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VetFormData>({
    resolver: zodResolver(vetSchema),
    defaultValues: {
      name: "",
      phone: "",
      clinic: "",
    },
  });

  const onSubmit = async (data: VetFormData) => {
    try {
      await axios.post("/api/vets", data, { withCredentials: true });

      toast.success("Nowy weterynarz został dodany!");
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
    <DashboardPage
      title="Dodaj weterynarza"
      description="Wprowadź dane weterynarza i kliniki poniżej."
      showNavbar={false}
    >
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

          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting}
            className="w-full lg:w-auto"
          >
            {isSubmitting ? "Dodawanie..." : "Dodaj weterynarza"}
          </Button>
        </form>
    </DashboardPage>
  );
};

export default AddVetPage;
