import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings, Camera, Clock, Tags, Type, LogOut, User, AlertTriangle, Palette } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getSlideshowSettings, saveSlideshowSettings, SlideshowSettings, ColorScheme } from "@/lib/settings";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme-context";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SlideshowSettings>(getSlideshowSettings());
  const { user } = useAuth();
  const { colorScheme, darkMode, setColorScheme, toggleDarkMode } = useTheme();

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

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <div className="lg:flex lg:gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-sm">Mode:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{darkMode ? 'Dark' : 'Light'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Colors:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{colorScheme === 'military' ? 'Default' : 'Alternative'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Language:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">English</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Slideshow:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{settings.duration}s</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">User Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-600 text-white p-2 rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {(user as any).firstName} {(user as any).lastName}
                      </p>
                      <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {(user as any).email}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    size="sm" 
                    className="w-full font-mono text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                TrackMyRC v1.0
              </p>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-500">
                Built with React & Express
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-600 text-white p-3 rounded-lg">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono">
            Customize your TrackMyRC experience
          </p>
        </div>
      </div>

      {/* Mobile User Account Section */}
      <div className="block lg:hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-mono">User Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="bg-tamiya-red dark:bg-tamiya-blue p-2 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {(user as any).firstName} {(user as any).lastName}
                    </p>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {(user as any).email}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  size="sm" 
                  className="w-full font-mono text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Theme Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Palette className="h-5 w-5" />
            <span>Theme Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Dark Mode</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>

          {/* Color Scheme Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-mono font-medium">Color Scheme</Label>
            <Select 
              value={colorScheme} 
              onValueChange={(value: ColorScheme) => {
                setColorScheme(value);
                toast({
                  title: "Color scheme updated",
                  description: `Switched to ${value === 'military' ? 'default green/orange' : 'alternative red/blue'} colors.`,
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="military">Default (Green/Orange)</SelectItem>
                <SelectItem value="tamiya">Alternative (Red/Blue)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {colorScheme === 'military' 
                ? 'Default green (light mode) and orange (dark mode) theme'
                : 'Alternative red and blue colors'
              }
            </p>
          </div>
        </CardContent>
      </Card>

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

      {/* Disclaimer */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Disclaimer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            This app, <strong className="text-foreground">TrackMyRC</strong>, is an independent creation and is not affiliated with, endorsed by, sponsored by, or in any way officially connected with any RC car manufacturer, including but not limited to Traxxas, Tamiya, Arrma, Axial, Losi, or Associated Electrics.
          </p>

          <p>
            All product names, logos, brands, trademarks, and registered trademarks are the property of their respective owners. The use of these names, trademarks, and brands in this app is for identification purposes only and does not imply endorsement.
          </p>

          <p>
            <strong className="text-foreground">TrackMyRC</strong> is designed to help RC car enthusiasts organize their personal collection of RC car information, including models, hop-ups, manuals, setup sheets, and photos. It is not intended to replace official manufacturer resources or support. For official product information, support, and manuals, please refer directly to the respective RC car manufacturer's website and documentation.
          </p>

          <p>
            The developer of this app is not responsible for any inaccuracies, omissions, or misinterpretations of information found within the app, which is provided for general informational purposes only. Users are encouraged to always consult official manufacturer documentation for precise and up-to-date information.
          </p>

          <p>
            <strong className="text-foreground">By using this app, you acknowledge and agree to this disclaimer.</strong>
          </p>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}