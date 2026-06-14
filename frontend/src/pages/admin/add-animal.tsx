"use client";

import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Button, Container, Input, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Plus, Star, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SingleValueSelector } from "@/components/shared";
import { animalSchema, type AnimalFormData } from "@/schemas/animal.schema";
import {
  animalTypeValues,
  animalGenderValues,
  animalSizeValues,
  animalStatusValues,
  animalHealthStatusValues,
} from "@/constants/animal.constants";

const AddAnimalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      name: "",
      type: "INNE",
      gender: "SAMIEC",
      size: "SREDNI",
      traits: "",
      dateOfBirth: new Date().toISOString().split("T")[0],
      description: "",
      status: "ZNALEZIONY",
      healthStatus: "ZDROWY",
      nextVisitDate: new Date().toISOString().split("T")[0],
      foundAt: new Date().toISOString().split("T")[0],
      foundLocation: "",
      imageUrl: [],
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_IMAGES = 5;

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  const existingImages = watch("imageUrl") || [];

  const previewImages = [
    ...existingImages,
    ...pendingFiles.map((file) => URL.createObjectURL(file)),
  ];

  const canAddMore = previewImages.length < MAX_IMAGES;

  useEffect(() => {
    const objectUrls = pendingFiles.map((file) => URL.createObjectURL(file));

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingFiles]);

  const onSubmit = async (data: AnimalFormData) => {
    try {
      const uploadedUrls: string[] = [];

      // upload nowych zdjęć
      for (const file of pendingFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${id}/${fileName}`;

        const { error } = await supabase.storage
          .from("animals")
          .upload(filePath, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("animals")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // usuń zaznaczone zdjęcia ze storage
      if (deletedImages.length > 0) {
        const paths = deletedImages.map((fileUrl) => {
          const url = new URL(fileUrl);

          return decodeURIComponent(
            url.pathname.replace("/storage/v1/object/public/animals/", ""),
          );
        });

        const { error } = await supabase.storage.from("animals").remove(paths);

        if (error) throw error;
      }

      await axios.post(
        `/api/animals/`,
        {
          ...data,
          imageUrl: [...(data.imageUrl || []), ...uploadedUrls],
        },
        { withCredentials: true },
      );

      setPendingFiles([]);
      setDeletedImages([]);

      toast.success("Nowe zwierzę zostało utworzone!");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      navigate("/admin/zwierzeta");
    } catch (err) {
      console.error(err);
      toast.error("Wystąpił błąd podczas zapisywania.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);

    const totalImages = existingImages.length + pendingFiles.length;

    if (totalImages >= MAX_IMAGES) {
      toast.error("Możesz dodać maksymalnie 5 zdjęć.");
      return;
    }

    const availableSlots = MAX_IMAGES - totalImages;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      toast.error(`Możesz dodać jeszcze tylko ${availableSlots} zdjęć.`);
    }

    setPendingFiles((prev) => [...prev, ...filesToAdd]);
  };

  const handleRemoveImage = (index: number) => {
    if (index < existingImages.length) {
      const fileUrl = existingImages[index];

      setDeletedImages((prev) => {
        if (prev.includes(fileUrl)) return prev;
        return [...prev, fileUrl];
      });

      setValue(
        "imageUrl",
        existingImages.filter((_, i) => i !== index),
        { shouldDirty: true },
      );
    } else {
      const pendingIndex = index - existingImages.length;
      setPendingFiles((prev) => prev.filter((_, i) => i !== pendingIndex));
    }
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
            Dodaj zwierzę
          </h1>
          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            Wprowadź wszystkie dane zwierzęcia poniżej. Pamiętaj, aby zapisać po
            zakończeniu.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <Label htmlFor="name">Zdjęcia (maksymalnie 5)</Label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: MAX_IMAGES }).map((_, index) => {
                const img = previewImages[index];
                return (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-xl bg-gray-200"
                  >
                    {img ? (
                      <>
                        <span
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-15 right-3 z-10 cursor-pointer rounded-full bg-white p-1 sm:p-2"
                        >
                          <Trash className="scale-80 text-red-600 sm:scale-100" />
                        </span>

                        <span
                          onClick={() => {}}
                          className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white/10 p-1 sm:p-2"
                        >
                          <Star className="scale-80 text-yellow-600 sm:scale-100" />
                        </span>

                        <div className="absolute z-2 size-full bg-linear-to-l from-black/40 to-transparent" />

                        <img
                          src={img}
                          alt="animal"
                          className="absolute size-full object-cover"
                        />
                      </>
                    ) : (
                      <div
                        onClick={() => {
                          if (canAddMore && index === previewImages.length) {
                            fileInputRef.current?.click();
                          }
                        }}
                        className="flex size-full cursor-pointer items-center justify-center text-gray-400"
                      >
                        <Plus size={26} />
                      </div>
                    )}
                  </div>
                );
              })}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                hidden
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {/* IMIĘ */}
              <div className="space-y-2">
                <Label htmlFor="name">Imię</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Podaj imię..."
                  className={errors.name && "bg-red-600/20"}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* GATUNEK */}
              <div className="space-y-2">
                <Label>Gatunek</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <SingleValueSelector
                      items={[...animalTypeValues]}
                      placeholder="Wybierz gatunek"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                {errors.type && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* DATA URODZENIA */}
              <div className="space-y-2">
                <Label htmlFor="dateBirth">Data urodzenia</Label>
                <Input
                  id="dateBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  placeholder="Podaj datę urodzenia..."
                  className={errors.dateOfBirth && "bg-red-600/20"}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.dateOfBirth.message}
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
                      items={[...animalGenderValues]}
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

              {/* STATUS */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <SingleValueSelector
                      items={[...animalStatusValues]}
                      placeholder="Wybierz status"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                {errors.status && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* ROZMIAR */}
              <div className="space-y-2">
                <Label>Rozmiar</Label>
                <Controller
                  name="size"
                  control={control}
                  render={({ field }) => (
                    <SingleValueSelector
                      items={[...animalSizeValues]}
                      placeholder="Wybierz rozmiar"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                {errors.size && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.size.message}
                  </p>
                )}
              </div>

              {/* CECHY */}
              <div className="space-y-2">
                <Label htmlFor="traits">Cechy po przecinku</Label>
                <Input
                  id="traits"
                  {...register("traits")}
                  placeholder="np. łagodny, lękliwy..."
                  className={errors.traits && "bg-red-600/20"}
                />
                {errors.traits && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.traits.message}
                  </p>
                )}
              </div>

              {/* GATUNEK */}
              <div className="space-y-2">
                <Label>Stan zdrowia</Label>
                <Controller
                  name="healthStatus"
                  control={control}
                  render={({ field }) => (
                    <SingleValueSelector
                      items={[...animalHealthStatusValues]}
                      placeholder="Wybierz stan zdrowia"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                {errors.healthStatus && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.healthStatus.message}
                  </p>
                )}
              </div>

              {/* ZNALEZIONY (MIEJSCE) */}
              <div className="space-y-2">
                <Label htmlFor="foundLocation">Znaleziony w miejscowości</Label>
                <Input
                  id="foundLocation"
                  {...register("foundLocation")}
                  placeholder="Podaj miejscowość..."
                  className={errors.foundLocation && "bg-red-600/20"}
                />
                {errors.foundLocation && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.foundLocation.message}
                  </p>
                )}
              </div>

              {/* ZNALEZIONY (DATA) */}
              <div className="space-y-2">
                <Label htmlFor="foundAt">Znaleziony w dniu</Label>
                <Input
                  id="foundAt"
                  type="date"
                  {...register("foundAt")}
                  placeholder="Napisz datę znalezienia..."
                  className={errors.foundAt && "bg-red-600/20"}
                />
                {errors.foundAt && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.foundAt.message}
                  </p>
                )}
              </div>

              {/* NASTĘPNA WIZYTA */}
              <div className="space-y-2">
                <Label htmlFor="nextVisitDate">Następna wizyta</Label>
                <Input
                  id="nextVisitDate"
                  type="date"
                  {...register("nextVisitDate")}
                />
                {errors.nextVisitDate && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.nextVisitDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* OPIS */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Napisz coś więcej o zwierzęciu..."
                className={`h-50 resize-none lg:h-full ${errors.description && "bg-red-600/20"}`}
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
            variant={"success"}
            disabled={isSubmitting}
            className="w-full lg:w-auto"
          >
            {isSubmitting ? "Dodawanie..." : "Dodaj nowe zwierzę"}
          </Button>
        </form>
      </Container>
    </main>
  );
};

export default AddAnimalPage;
