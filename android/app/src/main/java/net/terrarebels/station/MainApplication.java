package net.terrarebels.station;


import android.content.Context;

import androidx.annotation.Nullable;
import androidx.multidex.MultiDexApplication;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import org.unimodules.adapters.react.ModuleRegistryAdapter;
import org.unimodules.adapters.react.ReactModuleRegistryProvider;

import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.List;

import net.terrarebels.station.KeystoreLib.KeystorePackage;
import net.terrarebels.station.PreferencesLib.PreferencesPackage;
import net.terrarebels.station.TerraWalletLib.TerraWalletPackage;
import net.terrarebels.station.UtilLib.CommonPackage;
import net.terrarebels.station.UtilLib.EmulatorCheckerPackage;
import net.terrarebels.station.UtilLib.PreventCapturePackage;
import net.terrarebels.station.UtilLib.PushNotificationManagerPackage;
import net.terrarebels.station.UtilLib.RootCheckerPackage;
import net.terrarebels.station.UtilLib.TamperCheckerPackage;
import net.terrarebels.station.generated.BasePackageList;

import com.facebook.react.bridge.JSIModulePackage;
import com.swmansion.reanimated.ReanimatedJSIModulePackage;

public class MainApplication extends MultiDexApplication implements ReactApplication {
  private final ReactModuleRegistryProvider mModuleRegistryProvider =
          new ReactModuleRegistryProvider(new BasePackageList().getPackageList(), null);

  private final ReactNativeHost mReactNativeHost =
          new ReactNativeHost(this) {
            @Override
            public boolean getUseDeveloperSupport() {
              return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
              List<ReactPackage> packages = new PackageList(this).getPackages();
              packages.add(new KeystorePackage());
              packages.add(new PreferencesPackage());
              packages.add(new TerraWalletPackage());
              packages.add(new RootCheckerPackage());
              packages.add(new PushNotificationManagerPackage());
              packages.add(new TamperCheckerPackage());
              packages.add(new EmulatorCheckerPackage());
              packages.add(new PreventCapturePackage());
              packages.add(new CommonPackage());

              List<ReactPackage> unimodules = Arrays.asList(
                      new ModuleRegistryAdapter(mModuleRegistryProvider)
              );
              packages.addAll(unimodules);

              return packages;
            }

            @Override
            protected String getJSMainModuleName() {
              return "index";
            }

            @Override
            protected JSIModulePackage getJSIModulePackage() {
              return new ReanimatedJSIModulePackage(); 
            }
          };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
          Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("net.terrarebels.station.ReactNativeFlipper");
        aClass
                .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
