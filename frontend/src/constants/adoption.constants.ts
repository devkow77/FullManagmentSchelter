import { formatAdoptionStatus } from "@/lib/utils";
import { toLabelValueOptions } from "@/constants/helpers";

export const adoptionStatusOptions = toLabelValueOptions(formatAdoptionStatus);
