"use client";

import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Button, Container, Input, Label } from "@/components/ui";
import axios from "axios";
import { Plus, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SingleValueSelector } from "@/components/shared";
import { addUserSchema, type AddUserFormData } from "@/schemas/user.schema";
import {
  addUserRoleValues,
  addUserGenderValues,
} from "@/constants/user.constants";

const AddUserPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      gender: "MEZCZYZNA",
      role: "PRACOWNIK",
      imageUrl: null,
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const existingImage = watch("imageUrl");

  const previewImage = pendingFile
    ? URL.createObjectURL(pendingFile)
    : existingImage;

  useEffect(() => {
    if (!pendingFile) return;

    const objectUrl = URL.createObjectURL(pendingFile);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingFile]);

  const onSubmit = async (data: AddUserFormData) => {
    try {
      let uploadedUrl: string | null = data.imageUrl;

      if (pendingFile) {
        const fileName = `${Date.now()}-${pendingFile.name}`;
        const filePath = `users/${fileName}`;

        const { error } = await supabase.storage
          .from("users")
          .upload(filePath, pendingFile);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("users")
          .getPublicUrl(filePath);

        uploadedUrl = publicUrlData.publicUrl;
      }

      await axios.post(
        "/api/users",
        {
          ...data,
          imageUrl: uploadedUrl,
        },
        {
          withCredentials: true,
        },
      );

      toast.success("Nowy użytkownik został utworzony!");

      navigate("/admin/pracownicy");
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
    const file = e.target.files?.[0];

    if (!file) return;

    if (pendingFile || existingImage) {
      toast.error("Możesz dodać maksymalnie 1 zdjęcie.");
      return;
    }

    setPendingFile(file);
  };

  const handleRemoveImage = () => {
    setPendingFile(null);
    setValue("imageUrl", null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
            Dodaj użytkownika
          </h1>

          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            Wprowadź wszystkie dane użytkownika poniżej.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <Label>Zdjęcie (maksymalnie 1)</Label>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <div className="relative aspect-square overflow-hidden rounded-full bg-black/20">
                {previewImage ? (
                  <>
                    <span
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white p-2"
                    >
                      <Trash className="text-red-600" />
                    </span>

                    <img
                      src={previewImage}
                      alt="user"
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

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                hidden
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="Podaj hasło..."
                {...register("password")}
                className={errors.password ? "bg-red-600/20" : ""}
              />
              {errors.password && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Płeć</Label>

              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={[...addUserGenderValues]}
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
              <Label>Rola</Label>

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <SingleValueSelector
                    items={[...addUserRoleValues]}
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
          </div>

          <Button
            type="submit"
            variant={"success"}
            disabled={isSubmitting}
            className="w-full lg:w-auto"
          >
            {isSubmitting ? "Dodawanie..." : "Dodaj nowego użytkownika"}
          </Button>
        </form>
      </Container>
    </main>
  );
};

export default AddUserPage;
