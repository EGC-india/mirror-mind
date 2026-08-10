package com.mirrormind.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.capacitorjs.plugins.network.Network;
import com.capacitorjs.plugins.network.NetworkStatus;

public class MainActivity extends BridgeActivity {

    private ConnectivityManager.NetworkCallback networkCallback;
    private View offlineLayoutView;
    private boolean isOffline = false;

    private class MyBridgeWebViewClient extends BridgeWebViewClient {
        public MyBridgeWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                showOfflineLayout(false); // Display generic error message: "Something went wrong"
            }
            super.onReceivedError(view, request, error);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            if (request.isForMainFrame()) {
                showOfflineLayout(false); // Display generic error message: "Something went wrong"
            }
            super.onReceivedHttpError(view, request, errorResponse);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set custom WebViewClient to catch load errors on the main frame
        if (bridge != null) {
            bridge.setWebViewClient(new MyBridgeWebViewClient(bridge));
        }

        // On launch check connection
        Network networkHelper = new Network(this);
        boolean isConnected = networkHelper.getNetworkStatus().connected;

        if (!isConnected) {
            showOfflineLayout(true); // Display "You're offline"
        }

        startNetworkMonitoring();
    }

    private void startNetworkMonitoring() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager != null) {
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onLost(@NonNull android.net.Network network) {
                    super.onLost(network);
                    runOnUiThread(() -> showOfflineLayout(true));
                }

                @Override
                public void onCapabilitiesChanged(@NonNull android.net.Network network, @NonNull NetworkCapabilities capabilities) {
                    super.onCapabilitiesChanged(network, capabilities);
                    boolean isConnected = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) &&
                                          capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
                    runOnUiThread(() -> {
                        if (isConnected) {
                            if (isOffline) {
                                hideOfflineLayout();
                                if (bridge != null && bridge.getWebView() != null) {
                                    String appUrl = bridge.getAppUrl();
                                    if (appUrl == null || appUrl.isEmpty()) {
                                        appUrl = bridge.getServerUrl();
                                    }
                                    bridge.getWebView().loadUrl(appUrl);
                                }
                            }
                        } else {
                            showOfflineLayout(true);
                        }
                    });
                }
            };
            try {
                connectivityManager.registerDefaultNetworkCallback(networkCallback);
            } catch (Exception e) {
                // Fallback for registry failures
            }
        }
    }

    private void stopNetworkMonitoring() {
        if (networkCallback != null) {
            ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (connectivityManager != null) {
                try {
                    connectivityManager.unregisterNetworkCallback(networkCallback);
                } catch (Exception e) {
                    // Ignore unregistry exceptions
                }
            }
        }
    }

    private void showOfflineLayout(boolean isNoConnectivity) {
        isOffline = true;
        runOnUiThread(() -> {
            if (offlineLayoutView == null) {
                offlineLayoutView = getLayoutInflater().inflate(R.layout.activity_offline, null);
                ViewGroup rootView = findViewById(android.R.id.content);
                if (rootView != null) {
                    rootView.addView(offlineLayoutView);
                }

                // Wire retry button
                View retryButton = offlineLayoutView.findViewById(R.id.retry_button);
                if (retryButton != null) {
                    retryButton.setOnClickListener(v -> handleRetry());
                }
            }

            // Customize text based on error case
            TextView titleView = offlineLayoutView.findViewById(R.id.offline_title);
            TextView subtextView = offlineLayoutView.findViewById(R.id.offline_subtext);
            if (isNoConnectivity) {
                if (titleView != null) titleView.setText("You're offline");
                if (subtextView != null) {
                    subtextView.setText("Mirror-Mind needs an internet connection to sync your reflections. Please check your connection and try again.");
                }
            } else {
                if (titleView != null) titleView.setText("Something went wrong");
                if (subtextView != null) {
                    subtextView.setText("Something went wrong loading Mirror-Mind. Please try again.");
                }
            }

            offlineLayoutView.setVisibility(View.VISIBLE);
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().setVisibility(View.GONE);
                bridge.getWebView().stopLoading();
            }
        });
    }

    private void hideOfflineLayout() {
        isOffline = false;
        runOnUiThread(() -> {
            if (offlineLayoutView != null) {
                offlineLayoutView.setVisibility(View.GONE);
            }
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().setVisibility(View.VISIBLE);
            }
        });
    }

    private void handleRetry() {
        Network networkHelper = new Network(this);
        boolean isConnected = networkHelper.getNetworkStatus().connected;
        if (isConnected) {
            hideOfflineLayout();
            if (bridge != null && bridge.getWebView() != null) {
                String appUrl = bridge.getAppUrl();
                if (appUrl == null || appUrl.isEmpty()) {
                    appUrl = bridge.getServerUrl();
                }
                bridge.getWebView().loadUrl(appUrl);
            }
        } else {
            showOfflineLayout(true);
        }
    }

    @Override
    public void onDestroy() {
        stopNetworkMonitoring();
        super.onDestroy();
    }
}
