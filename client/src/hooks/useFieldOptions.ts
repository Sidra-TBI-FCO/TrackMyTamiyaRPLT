import { useQuery } from "@tanstack/react-query";
import type { FieldOptionKey } from "@shared/schema";

type FieldOptionsResponse = Record<string, string[]>;

const DEFAULT_OPTIONS: Record<FieldOptionKey, string[]> = {
  scale: ["1/10", "1/12", "1/14", "1/16", "1/18", "1/24", "1/8"],
  driveType: ["RWD", "FWD", "4WD", "AWD"],
  chassisMaterial: [
    "Plastic",
    "Carbon Fiber",
    "Aluminium",
    "FRP (Fiberglass Reinforced Plastic)",
    "Composite",
    "Hybrid"
  ],
  differentialType: [
    "Gears",
    "Oil-Filled",
    "Ball Differential",
    "Solid Axle",
    "Locked",
    "Front: Ball, Rear: Gears"
  ],
  motorSize: [
    "540",
    "380",
    "Brushless",
    "370",
    "550",
    "Custom"
  ],
  batteryType: [
    "NiMH",
    "LiPo 2S",
    "LiPo 3S",
    "LiFe",
    "NiCd",
    "Dry Cell"
  ],
  buildStatus: [
    "planning",
    "building",
    "built",
    "maintenance"
  ],
  hopUpCategory: [
    "Suspension",
    "Drivetrain",
    "Electronics",
    "Body/Exterior",
    "Tires/Wheels",
    "Chassis",
    "Motor/ESC",
    "Steering",
    "Bearings",
    "Other"
  ],
};

export function useFieldOptions() {
  const { data, isLoading } = useQuery<FieldOptionsResponse>({
    queryKey: ["/api/field-options"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getOptions = (fieldKey: FieldOptionKey): string[] => {
    // Return API options if available, otherwise fall back to defaults
    if (data && data[fieldKey] && data[fieldKey].length > 0) {
      return data[fieldKey];
    }
    return DEFAULT_OPTIONS[fieldKey] || [];
  };

  return {
    getOptions,
    isLoading,
    hasApiOptions: !!data,
  };
}
