"use client";

import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Button, Input, Label, Textarea } from "@/components/ui";
import axios from "axios";
import { Plus, Star, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SingleValueSelector, DashboardPage } from "@/components/shared";
import { animalSchema, type AnimalFormData, getMinNextVisitDate, getMaxPastOrTodayDate } from "@/schemas/animal.schema";
import {
  animalTypeValues,
  animalGenderValues,
  animalSizeValues,
  animalStatusValues,
  animalHealthStatusValues,
} from "@/constants/animal.constants";
import type { Cage } from "@/types/animal";
import { useQuery } from "@tanstack/react-query";

const getAvailableCages = async () => {
  const res = await axios.get<Cage[]>("/api/cages", {
    params: { available: true },
    withCredentials: true,
  });
  return res.data;
};

const formatCageNumber = (number: number) =>
  String(number).padStart(2, "0");

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
      nextVisitDate: "",
      foundAt: new Date().toISOString().split("T")[0],
      foundLocation: "",
      cageId: 0,
      isSterilized: false,
      isVaccinated: false,
      isChildFriendly: false,
      isTrained: false,
      lovesPlay: false,
      lovesWalks: false,
      acceptsDogs: false,
      acceptsCats: false,
      lovesAffection: false,
      poorlyToleratesShelter: false,
      imageUrl: [],
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_IMAGES = 5;

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  const existingImages = watch("imageUrl") || [];
  const selectedCageId = watch("cageId");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const { data: cages = [] } = useQuery({
    queryKey: ["cages", "available"],
    queryFn: getAvailableCages,
  });

  const freeZones = useMemo(
    () => [...new Set(cages.map((cage) => cage.zone))].sort(),
    [cages],
  );

  const cagesInSelectedZone = useMemo(
    () =>
      selectedZone
        ? cages
            .filter((cage) => cage.zone === selectedZone)
            .sort((a, b) => a.number - b.number)
        : [],
    [cages, selectedZone],
  );

  const cageNumberItems = useMemo(
    () => cagesInSelectedZone.map((cage) => formatCageNumber(cage.number)),
    [cagesInSelectedZone],
  );

  const selectedCageNumber = useMemo(() => {
    const cage = cagesInSelectedZone.find((item) => item.id === selectedCageId);
    return cage ? formatCageNumber(cage.number) : null;
  }, [cagesInSelectedZone, selectedCageId]);

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

      const combinedImages = [...(data.imageUrl || []), ...uploadedUrls];
      const primaryIndex = Math.min(
        primaryImageIndex,
        Math.max(combinedImages.length - 1, 0),
      );
      const imageUrl =
        combinedImages.length === 0
          ? []
          : [
              combinedImages[primaryIndex],
              ...combinedImages.filter((_, i) => i !== primaryIndex),
            ];

      await axios.post(
        `/api/animals/`,
        {
          ...data,
          imageUrl,
        },
        { withCredentials: true },
      );

      setPendingFiles([]);
      setDeletedImages([]);
      setPrimaryImageIndex(0);

      toast.success("Nowe zwierzę zostało utworzone!");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      navigate("/pracownik/zwierzeta");
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

    setPrimaryImageIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index >= previewImages.length) return;
    setPrimaryImageIndex(index);
  };

  return (
    <DashboardPage
      title="Dodaj zwierzę"
      description="Wprowadź wszystkie dane zwierzęcia poniżej. Pamiętaj, aby zapisać po zakończeniu."
      showNavbar={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <Label htmlFor="name">Zdjęcia (maksymalnie 5)</Label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: MAX_IMAGES }).map((_, index) => {
                const img = previewImages[index];
                const isPrimary = index === primaryImageIndex && !!img;

                return (
                  <div
                    key={index}
                    className={`${isPrimary ? "scale-105 border-4 border-yellow-400" : ""} relative aspect-square overflow-hidden rounded-2xl bg-gray-200`}
                  >
                    {img ? (
                      <>
                        <span
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-12 right-3 z-10 cursor-pointer rounded-full bg-white/50 p-1 sm:top-14 sm:p-2"
                        >
                          <Trash className="scale-80 text-red-600 sm:scale-100" />
                        </span>

                        <span
                          onClick={() => handleSetPrimaryImage(index)}
                          className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white/50 p-1 sm:p-2"
                        >
                          <Star
                            className={`scale-80 text-yellow-600 sm:scale-100 ${isPrimary ? "fill-yellow-600" : ""}`}
                          />
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
            <div className="flex-1 space-y-4">
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
                <Label htmlFor="dateOfBirth">Data urodzenia</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  max={getMaxPastOrTodayDate()}
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

              {/* STAN ZDROWIA */}
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

              {/* STREFA I WOLNA KLATKA */}
              <div className="space-y-2">
                <Label>Strefa</Label>
                <SingleValueSelector
                  items={freeZones}
                  placeholder="Wybierz strefę"
                  value={selectedZone}
                  onValueChange={(zone) => {
                    setSelectedZone(zone);
                    const stillValid = cages.some(
                      (cage) => cage.id === selectedCageId && cage.zone === zone,
                    );
                    if (!stillValid) setValue("cageId", 0);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Wolna klatka</Label>
                <Controller
                  name="cageId"
                  control={control}
                  render={({ field }) => (
                    <SingleValueSelector
                      items={cageNumberItems}
                      placeholder={
                        selectedZone
                          ? "Wybierz wolną klatkę"
                          : "Najpierw wybierz strefę"
                      }
                      value={selectedCageNumber}
                      onValueChange={(numberLabel) => {
                        const cage = cagesInSelectedZone.find(
                          (item) =>
                            formatCageNumber(item.number) === numberLabel,
                        );
                        field.onChange(cage?.id ?? 0);
                      }}
                    />
                  )}
                />
                {errors.cageId && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.cageId.message}
                  </p>
                )}
              </div>

              {/* CECHY BOOLEAN */}
              <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("isSterilized")}
                    className="size-4 accent-green-600"
                  />
                  Sterylizacja/Kastracja
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("isVaccinated")}
                    className="size-4 accent-green-600"
                  />
                  Szczepienia
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("isChildFriendly")}
                    className="size-4 accent-green-600"
                  />
                  Przyjazny dzieciom
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("isTrained")}
                    className="size-4 accent-green-600"
                  />
                  Szkolony
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("lovesPlay")}
                    className="size-4 accent-green-600"
                  />
                  Uwielbia zabawę
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("lovesWalks")}
                    className="size-4 accent-green-600"
                  />
                  Uwielbia spacery
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("acceptsDogs")}
                    className="size-4 accent-green-600"
                  />
                  Akceptuje psy
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("acceptsCats")}
                    className="size-4 accent-green-600"
                  />
                  Akceptuje koty
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("lovesAffection")}
                    className="size-4 accent-green-600"
                  />
                  Uwielbia pieszczoty
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium md:text-base">
                  <Input
                    type="checkbox"
                    {...register("poorlyToleratesShelter")}
                    className="size-4 accent-green-600"
                  />
                  Źle nosi pobyt w schronisku
                </Label>
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
                  max={getMaxPastOrTodayDate()}
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
                  min={getMinNextVisitDate()}
                  className={errors.nextVisitDate && "bg-red-600/20"}
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
                className="h-50 resize-none lg:h-full"
                placeholder="Napisz coś więcej o zwierzęciu..."
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
    </DashboardPage>
  );
};

export default AddAnimalPage;
