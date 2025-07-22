import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, CheckCircle2, Clock, X, Search, Filter, Package, DollarSign } from "lucide-react";
import type { HopUpPart } from "@shared/schema";
import { ModelWithRelations } from "@/types";
import HopUpCard from "@/components/hop-ups/hop-up-card";

interface PartWithModel extends HopUpPart {
  model: {
    id: number;
    name: string;
    itemNumber: string;
  };
}

export default function Parts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterModel, setFilterModel] = useState("all");

  // Fetch all models to get their parts
  const { data: models = [], isLoading: modelsLoading } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  // Flatten all hop-up parts from all models
  const allParts: PartWithModel[] = models.flatMap(model => 
    (model.hopUpParts || []).map(part => ({
      ...part,
      model: {
        id: model.id,
        name: model.name,
        itemNumber: model.itemNumber || ""
      }
    }))
  );

  // Calculate stats
  const totalParts = allParts.length;
  const installedParts = allParts.filter(part => part.installationStatus === "installed").length;
  const plannedParts = allParts.filter(part => part.installationStatus === "planned").length;
  const totalInvestment = allParts.reduce((sum, part) => {
    const cost = part.cost ? parseFloat(part.cost) : 0;
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  // Get unique values for filters
  const categories = Array.from(new Set(allParts.map(part => part.category).filter(Boolean)));
  const modelNames = Array.from(new Set(allParts.map(part => part.model.name)));

  // Filter parts
  const filteredParts = allParts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.model.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || part.category === filterCategory;
    const matchesStatus = filterStatus === "all" || part.installationStatus === filterStatus;
    const matchesBrand = filterBrand === "all" || 
                        (filterBrand === "tamiya" && part.isTamiyaBrand) ||
                        (filterBrand === "aftermarket" && !part.isTamiyaBrand);
    const matchesModel = filterModel === "all" || part.model.name === filterModel;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesBrand && matchesModel;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "installed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Installed</Badge>;
      case "planned":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Planned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (modelsLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            All Hop-Up Parts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-mono">
            Master list of all hop-up parts across your collection
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{totalParts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Total Parts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{installedParts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Installed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{plannedParts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Planned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">${totalInvestment.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parts, models, suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="tamiya">Tamiya</SelectItem>
                <SelectItem value="aftermarket">Aftermarket</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {modelNames.map(modelName => (
                  <SelectItem key={modelName} value={modelName}>{modelName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
                setFilterStatus("all");
                setFilterBrand("all");
                setFilterModel("all");
              }}
              className="font-mono"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parts List - Compact Grid Layout */}
      <div className="space-y-6">
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 font-mono">
                {allParts.length === 0 ? "No hop-up parts found. Add some parts to your models to see them here." : "No parts match your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredParts.map((part) => (
              <HopUpCard
                key={`${part.modelId}-${part.id}`}
                part={{
                  ...part,
                  storeUrls: part.storeUrls || {}
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}