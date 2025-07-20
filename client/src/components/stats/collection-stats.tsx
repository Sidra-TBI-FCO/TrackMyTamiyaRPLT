import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Wrench, DollarSign } from "lucide-react";
import { CollectionStats } from "@/types";

export default function CollectionStatsComponent() {
  const { data: stats, isLoading } = useQuery<CollectionStats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 font-mono">
        No stats available
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Models",
      value: stats.totalModels.toString(),
      icon: Car,
      color: "bg-red-600",
    },
    {
      label: "Active Builds",
      value: stats.activeBuilds.toString(),
      icon: Wrench,
      color: "bg-blue-600",
    },
    {
      label: "Total Investment",
      value: `$${stats.totalInvestment}`,
      icon: DollarSign,
      color: "bg-green-600",
    },
  ];

  return (
    <div className="space-y-4">
      {statItems.map((stat) => (
        <Card key={stat.label} className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
              <div className={`p-3 ${stat.color} bg-opacity-10 rounded-lg`}>
                <stat.icon className={`text-xl ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
