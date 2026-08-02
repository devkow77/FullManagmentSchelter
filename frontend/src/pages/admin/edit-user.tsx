"use client";

import { toast } from "sonner";
import { useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Container,
  Input,
  Label,
  Textarea,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import axios from "axios";
import { Plus, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  MultiValueSelector,
  SingleValueSelector,
  TableRowActions,
  FilterToolbar,
  DashboardTableFooter,
} from "@/components/shared";
import { editUserSchema, type EditUserFormData, getMaxDateOfBirth } from "@/schemas/user.schema";
import { userRoleValues, userGenderValues } from "@/constants/user.constants";
import { adoptionStatusOptions } from "@/constants/adoption.constants";
import type { Adoption } from "@/types/adoption";
import { formatAdoptionStatus, styleAdoptionStatus } from "@/lib/utils";

type AppUser = {
  id: number;
  fullName: string;
  email: string;
  gender: string;
  role: string;
  phoneNumber: string | null;
  city: string | null;
  postalCode: string | null;
  street: string | null;
  dateOfBirth: string | null;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  isBanned: boolean;
  adminNote: string | null;
  imageUrl: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
};

const formatDateInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const RETURN_PATHS = ["/admin/pracownicy", "/pracownik/uzytkownicy"] as const;
type ReturnPath = (typeof RETURN_PATHS)[number];

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo: ReturnPath =
    RETURN_PATHS.find(
      (path) =>
        path === (location.state as { returnTo?: string } | null)?.returnTo,
    ) ?? "/pracownik/uzytkownicy";

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      gender: "MEZCZYZNA",
      role: "UZYTKOWNIK",
      phoneNumber: "",
      city: "",
      postalCode: "",
      street: "",
      dateOfBirth: null,
      hasChildren: false,
      hasOtherAnimals: false,
      isBanned: false,
      adminNote: "",
      imageUrl: "",
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deletedImage, setDeletedImage] = useState<string | null>(null);

  const [meta, setMeta] = useState({
    twoFactorEnabled: false,
    createdAt: "",
  });

  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [selectedAdoptionStatuses, setSelectedAdoptionStatuses] = useState<
    string[]
  >([]);

  const existingImage = watch("imageUrl");
  const userRole = watch("role");

  const previewImage = pendingFile
    ? URL.createObjectURL(pendingFile)
    : existingImage || null;

  useEffect(() => {
    document.title = "Edytuj dane | Schronisko";
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get<AppUser>(`/api/users/${id}`, {
          withCredentials: true,
        });

        reset({
          fullName: res.data.fullName,
          email: res.data.email,
          gender: res.data.gender as EditUserFormData["gender"],
          role: res.data.role as EditUserFormData["role"],
          phoneNumber: res.data.phoneNumber ?? "",
          city: res.data.city ?? "",
          postalCode: res.data.postalCode ?? "",
          street: res.data.street ?? "",
          dateOfBirth: formatDateInput(res.data.dateOfBirth) ?? null,
          hasChildren: res.data.hasChildren,
          hasOtherAnimals: res.data.hasOtherAnimals,
          isBanned: res.data.isBanned,
          adminNote: res.data.adminNote ?? "",
          imageUrl: res.data.imageUrl ?? "",
        });

        setMeta({
          twoFactorEnabled: res.data.twoFactorEnabled,
          createdAt: res.data.createdAt,
        });
      } catch {
        toast.error("Nie udało się pobrać danych użytkownika.");
        navigate(returnTo);
      }
    };

    if (id) fetchUser();
  }, [id, reset, navigate, returnTo]);

  useEffect(() => {
    const fetchAdoptions = async () => {
      try {
        const res = await axios.get<Adoption[]>(`/api/adoptions?userId=${id}`, {
          withCredentials: true,
        });
        setAdoptions(res.data);
      } catch {
        toast.error("Nie udało się pobrać adopcji użytkownika.");
      }
    };

    if (id && userRole === "UZYTKOWNIK") {
      fetchAdoptions();
    } else {
      setAdoptions([]);
    }
  }, [id, userRole]);

  const filteredAdoptions = useMemo(() => {
    return adoptions.filter((adoption) => {
      const matchesStatus =
        selectedAdoptionStatuses.length === 0 ||
        selectedAdoptionStatuses.includes(adoption.status);

      return matchesStatus;
    });
  }, [adoptions, selectedAdoptionStatuses]);

  const resetAdoptionFilters = () => {
    setSelectedAdoptionStatuses([]);
  };

  useEffect(() => {
    if (!pendingFile) return;

    const url = URL.createObjectURL(pendingFile);

    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const onSubmit = async (data: EditUserFormData) => {
    try {
      let uploadedUrl: string | null = data.imageUrl || null;

      if (pendingFile) {
        const filePath = `${id}/${Date.now()}-${pendingFile.name}`;

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

      await axios.patch(
        `/api/users/${id}`,
        {
          ...data,
          imageUrl: uploadedUrl,
        },
        { withCredentials: true },
      );

      toast.success("Dane użytkownika zostały zaktualizowane");
      navigate(returnTo);
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
            id="edit-user-heading"
            className="text-3xl font-bold text-green-900 md:text-5xl"
          >
            Edytuj dane
          </h1>
          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            Wprowadź zmiany w profilu użytkownika poniżej. Pamiętaj, aby zapisać
            po zakończeniu edycji.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <Label>Zdjęcie profilowe</Label>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {/* ZDJĘCIE */}
              <div className="relative aspect-square overflow-hidden rounded-full bg-gray-100">
                {previewImage ? (
                  <>
                    <span
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white p-1 sm:p-2"
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

              {/* WERYFIKACJA 2FA & KONTO UTWORZONE */}
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
            {/* IMIĘ I NAZWISKO */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Imię i nazwisko</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder="Podaj imię i nazwisko..."
                className={errors.fullName ? "bg-red-600/20" : ""}
              />
              {errors.fullName && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                {...register("email")}
                placeholder="Podaj email..."
                className={errors.email ? "bg-red-600/20" : ""}
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* NUMER TELEFONU */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Numer telefonu</Label>
              <Input
                id="phoneNumber"
                {...register("phoneNumber")}
                placeholder="np. 500123456"
                className={errors.phoneNumber ? "bg-red-600/20" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* ROLA */}
            <div className="space-y-2">
              <Label>Rola</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={[...userRoleValues]}
                    placeholder="Wybierz rolę"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.role && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* PŁEĆ */}
            <div className="space-y-2">
              <Label>Płeć</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={[...userGenderValues]}
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

            {/* DATA URODZENIA */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data urodzenia</Label>
              <Input
                id="dateOfBirth"
                type="date"
                max={getMaxDateOfBirth()}
                {...register("dateOfBirth")}
                className={errors.dateOfBirth ? "bg-red-600/20" : ""}
              />
              {errors.dateOfBirth && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* MIASTO */}
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="Podaj miasto..."
                className={errors.city ? "bg-red-600/20" : ""}
              />
              {errors.city && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.city.message}
                </p>
              )}
            </div>

            {/* KOD POCZTOWY */}
            <div className="space-y-2">
              <Label htmlFor="postalCode">Kod pocztowy</Label>
              <Input
                id="postalCode"
                {...register("postalCode")}
                placeholder="np. 00-001"
                className={errors.postalCode ? "bg-red-600/20" : ""}
              />
              {errors.postalCode && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.postalCode.message}
                </p>
              )}
            </div>

            {/* ULICA I NUMER */}
            <div className="space-y-2">
              <Label htmlFor="street">Ulica i numer</Label>
              <Input
                id="street"
                {...register("street")}
                placeholder="Podaj adres..."
                className={errors.street ? "bg-red-600/20" : ""}
              />
              {errors.street && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.street.message}
                </p>
              )}
            </div>

            {/* NOTATKA ADMINISTRATORA */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="adminNote">Notatka administratora</Label>
              <Textarea
                id="adminNote"
                {...register("adminNote")}
                placeholder="Opcjonalna notatka widoczna dla pracowników..."
                className={`${errors.adminNote ? "bg-red-600/20" : ""} h-50 resize-none`}
              />
              {errors.adminNote && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.adminNote.message}
                </p>
              )}
            </div>

            {/* CZY MA DZIECI & INNE ZWIERZĘTA & CZY KONTO JEST ZABLOKOWANE */}
            <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
              <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                <Input
                  type="checkbox"
                  {...register("hasChildren")}
                  className="size-4 accent-green-600"
                />
                Posiada dzieci
              </Label>

              <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                <Input
                  type="checkbox"
                  {...register("hasOtherAnimals")}
                  className="size-4 accent-green-600"
                />
                Posiada inne zwierzęta
              </Label>

              <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                <Input
                  type="checkbox"
                  {...register("isBanned")}
                  className="size-4 accent-green-600"
                />
                Konto zablokowane
              </Label>
            </div>
          </div>

          <Button type="submit" variant={"success"} disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Zaktualizuj dane użytkownika"}
          </Button>
        </form>

        {userRole === "UZYTKOWNIK" && (
          <section id="adoptions" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-3xl">
                Adopcje
              </h2>
              <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
                Lista adopcji złożonych przez tego użytkownika.
              </p>
            </div>

            <FilterToolbar>
              <MultiValueSelector
                items={adoptionStatusOptions}
                placeholder="Status"
                value={selectedAdoptionStatuses}
                onValueChange={setSelectedAdoptionStatuses}
              />

              <Button onClick={resetAdoptionFilters} variant="destructive">
                Resetuj filtry
              </Button>
            </FilterToolbar>

            <Table>
              <TableCaption>Adopcje użytkownika</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Zwierzę</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data złożenia</TableHead>
                  <TableHead>Wiadomość użytkownika</TableHead>
                  <TableHead>Wiadomość pracownika</TableHead>
                  <TableHead className="w-0 text-right">Opcje</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAdoptions.length ? (
                  filteredAdoptions.map((adoption) => (
                    <TableRow
                      key={adoption.id}
                      onClick={() =>
                        navigate(`/admin/adopcje/${adoption.id}/edycja`)
                      }
                      className="cursor-pointer"
                    >
                      <TableCell>{adoption.animal.name}</TableCell>
                      <TableCell>
                        <span
                          className={`${styleAdoptionStatus(adoption.status)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatAdoptionStatus[adoption.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(adoption.createdAt).toLocaleDateString(
                          "pl-PL",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )}{" "}
                        r.
                      </TableCell>
                      <TableCell>
                        {adoption.message
                          ? `${adoption.message.slice(0, 30)}...`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {adoption.employeeNote
                          ? `${adoption.employeeNote.slice(0, 30)}...`
                          : "Brak"}
                      </TableCell>
                      <TableCell
                        className="w-0 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TableRowActions
                          editTo={`/pracownik/adopcje/${adoption.id}/edycja`}
                          editLabel="Szczegóły"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-5 text-center font-medium"
                    >
                      Brak adopcji spełniających wybrane filtry.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <DashboardTableFooter
                columns={["always", "always", "always", "always", "always", "always"]}
                sumLabel="Suma adopcji"
                sumValue={filteredAdoptions.length}
              />
            </Table>
          </section>
        )}
      </Container>
    </main>
  );
};

export default EditUserPage;
