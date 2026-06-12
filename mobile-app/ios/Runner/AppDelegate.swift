import UIKit
import Flutter
import GoogleMaps

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // --- Google-Maps-API-Key Injektion -----------------------------------
    // Der echte Key wird NICHT hier hardcoded. Er kommt aus Info.plist unter
    // dem Schluessel `GoogleMapsApiKey`, dessen Wert per Build-Konfiguration
    // (.xcconfig-Variable $(GOOGLE_MAPS_API_KEY)) gesetzt wird. Die xcconfig
    // mit dem echten Key ist gitignored. Fallback: leerer Key -> Build laeuft,
    // Karte bleibt leer. Der Key MUSS in der Google Cloud Console per
    // Bundle-ID beschraenkt werden. Siehe MAPS_SETUP.md.
    if let apiKey = Bundle.main.object(forInfoDictionaryKey: "GoogleMapsApiKey") as? String,
       !apiKey.isEmpty,
       apiKey != "$(GOOGLE_MAPS_API_KEY)" {
      GMSServices.provideAPIKey(apiKey)
    }

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
