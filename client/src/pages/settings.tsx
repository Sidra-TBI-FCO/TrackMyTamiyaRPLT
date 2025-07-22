import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings, Camera, Clock, Tags, Type } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getSlideshowSettings, saveSlideshowSettings, SlideshowSettings } from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SlideshowSettings>(getSlideshowSettings());

  const updateSetting = <K extends keyof SlideshowSettings>(
    key: K,
    value: SlideshowSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSlideshowSettings(newSettings);
    toast({
      title: "Settings saved",
      description: "Your slideshow preferences have been updated.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-red-600 text-white p-3 rounded-lg">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono">
            Customize your TrackMyTamiya experience
          </p>
        </div>
      </div>

      {/* Photo Frame Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Camera className="h-5 w-5" />
            <span>Photo Frame Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slideshow Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-mono font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Slide Duration</span>
            </Label>
            <Select 
              value={settings.duration.toString()} 
              onValueChange={(value) => updateSetting('duration', parseInt(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 seconds</SelectItem>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="4">4 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="7">7 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              How long each photo is displayed in the slideshow
            </p>
          </div>

          {/* Auto Start */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Auto-start slideshow</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Automatically begin playing when slideshow opens
              </p>
            </div>
            <Switch
              checked={settings.autoStart}
              onCheckedChange={(checked) => updateSetting('autoStart', checked)}
            />
          </div>

          {/* Show Captions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium flex items-center space-x-2">
                <Type className="h-4 w-4" />
                <span>Show photo captions</span>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Display photo descriptions in the slideshow
              </p>
            </div>
            <Switch
              checked={settings.showCaptions}
              onCheckedChange={(checked) => updateSetting('showCaptions', checked)}
            />
          </div>

          {/* Show Tags */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium flex items-center space-x-2">
                <Tags className="h-4 w-4" />
                <span>Show model tags</span>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Display model tags and categories in the slideshow
              </p>
            </div>
            <Switch
              checked={settings.showTags}
              onCheckedChange={(checked) => updateSetting('showTags', checked)}
            />
          </div>

          {/* Shuffle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Shuffle photos</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Randomize the order of photos in the slideshow
              </p>
            </div>
            <Switch
              checked={settings.shuffle}
              onCheckedChange={(checked) => updateSetting('shuffle', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-mono">Reset Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Reset to defaults</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Restore all settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem('tamiya_slideshow_settings');
                const defaultSettings = getSlideshowSettings();
                setSettings(defaultSettings);
                toast({
                  title: "Settings reset",
                  description: "All settings have been restored to defaults.",
                });
              }}
              className="font-mono"
            >
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}