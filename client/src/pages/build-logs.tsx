import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Wrench, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BuildLogList from "@/components/build-log/build-log-list";
import { ModelWithRelations } from "@/types";

export default function BuildLogs() {
  const params = useParams();
  const modelId = params.modelId ? parseInt(params.modelId) : null;

  const { data: model, isLoading } = useQuery<ModelWithRelations>({
    queryKey: ["/api/models", modelId?.toString()],
    enabled: !!modelId,
  });

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
          {modelId && model ? (
            <div>
              {/* Mobile Back Button */}
              <div className="mb-4 lg:hidden">
                <Link href="/models">
                  <Button variant="ghost" className="font-mono">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Models
                  </Button>
                </Link>
              </div>

              {/* Desktop Breadcrumb */}
              <div className="hidden lg:block mb-6">
                <nav className="flex items-center space-x-2 text-sm font-mono">
                  <Link href="/models" className="text-red-600 hover:text-red-700">
                    Models
                  </Link>
                  <span className="text-gray-400">/</span>
                  <Link href={`/models/${model.id}`} className="text-red-600 hover:text-red-700">
                    {model.name}
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-400">Build Log</span>
                </nav>
              </div>

              <BuildLogList modelId={modelId} modelName={model.name} />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  Build Logs
                </h1>
              </div>

              <Card className="p-12">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-6">
                    <Wrench className="h-16 w-16 mx-auto mb-4" />
                    <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                      Select a Model
                    </h2>
                    <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                      Choose a model from your collection to view and manage its build log.
                    </p>
                    <Link href="/models">
                      <Button className="bg-red-600 hover:bg-red-700 text-white font-mono">
                        Browse Models
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </>
          )}
    </div>
  );
}
