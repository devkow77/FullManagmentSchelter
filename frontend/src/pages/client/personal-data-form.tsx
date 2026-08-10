import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Button, Container, Input, Label, Textarea } from "@/components/ui";
import axios from "axios";
import { Plus, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SingleValueSelector } from "@/components/shared";
import {
  editOwnProfileSchema,
  type EditOwnProfileFormData,
  getMaxDateOfBirth,
} from "@/schemas/user.schema";
import {
  genderOptions,
  housingTypeOptions,
} from "@/constants/user.constants";
import { useAuth } from "@/context/AuthContext";

type OwnProfile = {
  id: number;
  fullName: string;
  email: string;
  gender: string;
  phoneNumber: string | null;
  city: string | null;
  postalCode: string | null;
  street: string | null;
  dateOfBirth: string | null;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  housingType: "DOM" | "MIESZKANIE" | "INNE" | null;
  hasGardenOrBalcony: boolean;
  livingConditions: string | null;
  imageUrl: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
};

const formatDateInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const PersonalDataFormPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<EditOwnProfileFormData, unknown, EditOwnProfileFormData>({
    resolver: zodResolver(editOwnProfileSchema),
    defaultValues: {
      fullName: "",
      gender: "MEZCZYZNA",
      phoneNumber: "",
      city: "",
      postalCode: "",
      street: "",
      dateOfBirth: "",
      hasChildren: false,
      hasOtherAnimals: false,
      housingType: "MIESZKANIE",
      hasGardenOrBalcony: false,
      livingConditions: "",
      imageUrl: "",
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deletedImage, setDeletedImage] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [meta, setMeta] = useState({
    twoFactorEnabled: false,
    createdAt: "",
  });

  const existingImage = watch("imageUrl");

  const previewImage = pendingFile
    ? URL.createObjectURL(pendingFile)
    : existingImage || null;

  useEffect(() => {
    document.title = "Formularz danych osobowych | Schronisko";
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get<OwnProfile>("/api/users/me", {
          withCredentials: true,
        });

        reset({
          fullName: res.data.fullName,
          gender: res.data.gender as EditOwnProfileFormData["gender"],
          phoneNumber: res.data.phoneNumber ?? "",
          city: res.data.city ?? "",
          postalCode: res.data.postalCode ?? "",
          street: res.data.street ?? "",
          dateOfBirth: formatDateInput(res.data.dateOfBirth) || "",
          hasChildren: res.data.hasChildren,
          hasOtherAnimals: res.data.hasOtherAnimals,
          housingType:
            (res.data.housingType as EditOwnProfileFormData["housingType"]) ??
            "MIESZKANIE",
          hasGardenOrBalcony: res.data.hasGardenOrBalcony,
          livingConditions: res.data.livingConditions ?? "",
          imageUrl: res.data.imageUrl ?? "",
        });

        setEmail(res.data.email);

        setMeta({
          twoFactorEnabled: res.data.twoFactorEnabled,
          createdAt: res.data.createdAt,
        });
      } catch {
        toast.error("Nie udało się pobrać danych profilu.");
        navigate("/konto");
      }
    };

    fetchProfile();
  }, [reset, navigate]);

  useEffect(() => {
    if (!pendingFile) return;

    const url = URL.createObjectURL(pendingFile);

    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const onSubmit = async (data: EditOwnProfileFormData) => {
    try {
      let uploadedUrl: string | null = data.imageUrl || null;

      if (pendingFile && user?.id) {
        const filePath = `${user.id}/${Date.now()}-${pendingFile.name}`;

        const { error } = await supabase.storage
          .from("users")
          .upload(filePath, pendingFile);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("users")
          .getPublicUrl(filePath);

        uploadedUrl = publicUrlData.publicUrl;
      }

      if (deletedImage) {
        const path = decodeURIComponent(
          new URL(deletedImage).pathname.replace(
            "/storage/v1/object/public/users/",
            "",
          ),
        );

        await supabase.storage.from("users").remove([path]);
      }

      const res = await axios.patch<OwnProfile>(
        "/api/users/me",
        {
          ...data,
          dateOfBirth: data.dateOfBirth,
          imageUrl: uploadedUrl,
        },
        { withCredentials: true },
      );

      if (user) {
        setUser({
          ...user,
          fullName: res.data.fullName,
        });
      }

      toast.success("Dane zostały zaktualizowane");
      navigate("/konto");
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setPendingFile(e.target.files[0]);
  };

  const handleRemoveImage = () => {
    if (existingImage) {
      setDeletedImage(existingImage);
      setValue("imageUrl", "");
    }

    setPendingFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <div className="space-y-2">
          <h1
            id="personal-data-heading"
            className="text-3xl font-bold text-green-900 md:text-5xl"
          >
            Formularz danych osobowych
          </h1>
          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            Uzupełnij dane oznaczone<span className="text-red-600" aria-hidden="true">*</span>{" "}
            — są wymagane, aby złożyć wniosek o adopcję. Musisz mieć ukończone
            18 lat.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-6">
            <Label>Zdjęcie profilowe</Label>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                {previewImage ? (
                  <>
                    <span
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3 z-10 cursor-pointer rounded-2xl bg-white p-1 sm:p-2"
                    >
                      <Trash className="text-red-600" />
                    </span>

                    <img
                      src={previewImage}
                      alt="Zdjęcie użytkownika"
                      className="absolute size-full object-cover"
                    />
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-full cursor-pointer items-center justify-center text-gray-400"
                  >
                    <Plus size={26} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Weryfikacja 2FA</Label>
                  <p
                    className={
                      meta.twoFactorEnabled ? "text-green-600" : "text-red-600"
                    }
                  >
                    {meta.twoFactorEnabled ? "Aktywna" : "Nieaktywna"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Konto utworzone</Label>
                  <p>
                    {meta.createdAt
                      ? new Date(meta.createdAt).toLocaleDateString("pl-PL")
                      : "-"}{" "}
                    r.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                hidden
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fullName" required>
                Imię i nazwisko
              </Label>
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder="Podaj imię i nazwisko..."
                className={errors.fullName ? "bg-red-600/20" : ""}
                aria-invalid={Boolean(errors.fullName)}
                required
              />
              {errors.fullName && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                readOnly
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" required>
                Numer telefonu
              </Label>
              <Input
                id="phoneNumber"
                {...register("phoneNumber")}
                placeholder="np. 500123456"
                className={errors.phoneNumber ? "bg-red-600/20" : ""}
                aria-invalid={Boolean(errors.phoneNumber)}
                required
              />
              {errors.phoneNumber && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label required>Płeć</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={genderOptions}
                    placeholder="Wybierz płeć"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.gender && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" required>
                Data urodzenia
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                max={getMaxDateOfBirth()}
                {...register("dateOfBirth")}
                className={errors.dateOfBirth ? "bg-red-600/20" : ""}
                aria-invalid={Boolean(errors.dateOfBirth)}
                required
              />
              {errors.dateOfBirth && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {String(errors.dateOfBirth.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" required>
                Miasto
              </Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="Podaj miasto..."
                className={errors.city ? "bg-red-600/20" : ""}
                aria-invalid={Boolean(errors.city)}
                required
              />
              {errors.city && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode" required>
                Kod pocztowy
              </Label>
              <Input
                id="postalCode"
                {...register("postalCode")}
                placeholder="np. 00-001"
                className={errors.postalCode ? "bg-red-600/20" : ""}
                aria-invalid={Boolean(errors.postalCode)}
                required
              />
              {errors.postalCode && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.postalCode.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" required>
                Ulica i numer
              </Label>
              <Input
                id="street"
                {...register("street")}
                placeholder="Podaj adres..."
                className={errors.street ? "bg-red-600/20" : ""}
                aria-invalid={Boolean(errors.street)}
                required
              />
              {errors.street && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.street.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label required>Typ mieszkania</Label>
              <Controller
                name="housingType"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={housingTypeOptions}
                    placeholder="Wybierz typ mieszkania"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.housingType && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.housingType.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="livingConditions" required>
                Opis warunków mieszkaniowych
              </Label>
              <Textarea
                id="livingConditions"
                {...register("livingConditions")}
                maxLength={500}
                placeholder="Np. mieszkam w domu z ogrodem, mam doświadczenie z psami średniej wielkości..."
                className={`min-h-28 resize-none ${errors.livingConditions ? "bg-red-600/20" : ""}`}
                aria-invalid={Boolean(errors.livingConditions)}
                required
              />
              {errors.livingConditions && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.livingConditions.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
              <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                <Input
                  type="checkbox"
                  {...register("hasChildren")}
                  className="size-4 accent-green-600"
                />
                Posiadam dzieci
              </Label>

              <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                <Input
                  type="checkbox"
                  {...register("hasOtherAnimals")}
                  className="size-4 accent-green-600"
                />
                Posiadam inne zwierzęta
              </Label>

              <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                <Input
                  type="checkbox"
                  {...register("hasGardenOrBalcony")}
                  className="size-4 accent-green-600"
                />
                Mam ogród lub balkon
              </Label>
            </div>
          </div>

          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Zapisz dane"}
          </Button>
        </form>
      </Container>
    </main>
  );
};

export default PersonalDataFormPage;
