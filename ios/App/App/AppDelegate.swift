import UIKit
import Capacitor
import WebKit
import AuthenticationServices

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var loginVC: LoginViewController?
    var forgotPasswordVC: ForgotPasswordViewController?
    weak var webView: WKWebView?
    var capacitorBridgeVC: CAPBridgeViewController?
    private var urlObservation: NSKeyValueObservation?
    private var isDoingGoogleOAuth = false
    private var authSession: ASWebAuthenticationSession?
    private var hasCheckedAuth = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Setup notification observers for auth
        NotificationCenter.default.addObserver(self, selector: #selector(performLogin(_:)), name: NSNotification.Name("PerformLogin"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(performPasswordReset(_:)), name: NSNotification.Name("PerformPasswordReset"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(performGoogleLogin), name: NSNotification.Name("PerformGoogleLogin"), object: nil)

        // Save reference to Capacitor's bridge VC (loaded from storyboard)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let bridge = self.window?.rootViewController as? CAPBridgeViewController {
                self.capacitorBridgeVC = bridge
                self.webView = bridge.webView
                self.setupMessageHandlers()
            }
        }

        // Check auth state and decide what to show
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.checkInitialAuthState()
        }

        return true
    }

    private func setupMessageHandlers() {
        guard let wv = webView else { return }
        let contentController = wv.configuration.userContentController
        contentController.add(self, name: "nativeAuth")
        contentController.add(self, name: "loginResult")
        contentController.add(self, name: "resetResult")
        contentController.add(self, name: "googleOAuthURL")
        contentController.add(self, name: "authCheck")

        // Observe URL changes
        urlObservation = wv.observe(\.url, options: [.new]) { [weak self] webView, change in
            guard let url = change.newValue as? URL else { return }
            self?.handleURLChange(url)
        }

        print("✅ Message handlers setup complete")
    }

    private func checkInitialAuthState() {
        guard !hasCheckedAuth else { return }
        hasCheckedAuth = true

        let js = """
        (async function() {
            try {
                const { data: { session } } = await window.supabase.auth.getSession();
                window.webkit.messageHandlers.authCheck.postMessage({
                    isLoggedIn: session !== null,
                    isInitialCheck: true
                });
            } catch(e) {
                window.webkit.messageHandlers.authCheck.postMessage({
                    isLoggedIn: false,
                    isInitialCheck: true
                });
            }
        })();
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    private func handleURLChange(_ url: URL) {
        let path = url.path
        print("🔍 URL changed to: \(url.absoluteString)")

        // Skip if doing Google OAuth
        if isDoingGoogleOAuth {
            if path == "/dashboard" || path.hasPrefix("/dashboard") {
                isDoingGoogleOAuth = false
                print("✅ Google OAuth successful - landed on dashboard")
                // Make sure Capacitor is visible
                if let bridge = capacitorBridgeVC {
                    window?.rootViewController = bridge
                }
            }
            return
        }

        DispatchQueue.main.async {
            if path == "/login" || path.hasPrefix("/login") {
                print("✅ LOGIN DETECTED - switching to native login")
                self.showLoginAsRoot()
            } else if path == "/forgot-password" || path.hasPrefix("/forgot-password") {
                print("✅ FORGOT PASSWORD DETECTED - switching to native forgot password")
                self.showForgotPasswordAsRoot()
            }
        }
    }

    private func showLoginAsRoot() {
        let loginVC = LoginViewController()

        loginVC.onLoginSuccess = { [weak self] in
            print("✅ Login success - switching to Capacitor")
            self?.loginVC = nil
            // Switch root back to Capacitor and navigate to dashboard
            if let bridge = self?.capacitorBridgeVC {
                self?.window?.rootViewController = bridge
                self?.webView?.evaluateJavaScript("window.location.href = '/dashboard';", completionHandler: nil)
            }
        }
        loginVC.onClose = { [weak self] in
            // No close on initial login - must login
            print("⚠️ Close pressed but login required")
        }
        loginVC.onForgotPassword = { [weak self] in
            self?.showForgotPasswordAsRoot()
        }
        loginVC.onCreateAccount = { [weak self] in
            // Switch to Capacitor for registration
            if let bridge = self?.capacitorBridgeVC {
                self?.window?.rootViewController = bridge
                self?.webView?.evaluateJavaScript("window.location.href = '/register';", completionHandler: nil)
            }
        }

        self.loginVC = loginVC
        window?.rootViewController = loginVC
        print("✅ Native Login set as root view controller")
    }

    private func showForgotPasswordAsRoot() {
        let forgotVC = ForgotPasswordViewController()

        forgotVC.onClose = { [weak self] in
            self?.showLoginAsRoot()
        }
        forgotVC.onBackToLogin = { [weak self] in
            self?.showLoginAsRoot()
        }

        self.forgotPasswordVC = forgotVC
        window?.rootViewController = forgotVC
        print("✅ Native Forgot Password set as root view controller")
    }

    func showNativeLogin() {
        guard let rootVC = window?.rootViewController else { return }

        // If Capacitor is not root, use showLoginAsRoot
        if !(rootVC is CAPBridgeViewController) {
            showLoginAsRoot()
            return
        }

        // Dismiss any existing modal
        if let presented = rootVC.presentedViewController {
            presented.dismiss(animated: false) { [weak self] in
                self?.presentLoginVC()
            }
            return
        }

        presentLoginVC()
    }

    private func presentLoginVC() {
        guard let rootVC = window?.rootViewController else { return }

        // Hide WebView while showing native login
        webView?.isHidden = true

        let loginVC = LoginViewController()
        loginVC.modalPresentationStyle = .fullScreen
        loginVC.modalTransitionStyle = .crossDissolve

        loginVC.onLoginSuccess = { [weak self] in
            self?.loginVC = nil
            self?.webView?.isHidden = false
            self?.webView?.evaluateJavaScript("window.location.href = '/dashboard';", completionHandler: nil)
        }
        loginVC.onClose = { [weak self] in
            self?.loginVC = nil
            self?.webView?.isHidden = false
            self?.webView?.evaluateJavaScript("window.history.back();", completionHandler: nil)
        }
        loginVC.onForgotPassword = { [weak self] in
            self?.loginVC = nil
            self?.showForgotPasswordAsRoot()
        }
        loginVC.onCreateAccount = { [weak self] in
            self?.loginVC = nil
            self?.webView?.isHidden = false
            self?.webView?.evaluateJavaScript("window.location.href = '/register';", completionHandler: nil)
        }

        self.loginVC = loginVC
        rootVC.present(loginVC, animated: true) {
            print("✅ Native Login presented")
        }
    }

    @objc private func performLogin(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let email = userInfo["email"] as? String,
              let password = userInfo["password"] as? String else { return }

        // Execute login via Supabase in webview
        let js = """
        (async function() {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: '\(email.replacingOccurrences(of: "'", with: "\\'"))',
                    password: '\(password.replacingOccurrences(of: "'", with: "\\'"))'
                });
                if (error) throw error;
                window.webkit.messageHandlers.loginResult.postMessage({success: true});
            } catch (e) {
                window.webkit.messageHandlers.loginResult.postMessage({success: false, error: e.message});
            }
        })();
        """

        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    @objc private func performGoogleLogin() {
        // Set flag to prevent native login from showing during OAuth
        isDoingGoogleOAuth = true

        // Dismiss native login first
        loginVC?.dismiss(animated: false) { [weak self] in
            self?.loginVC = nil

            // Get OAuth URL from Supabase and open in ASWebAuthenticationSession
            let js = """
            (async function() {
                try {
                    const { data, error } = await window.supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            skipBrowserRedirect: true,
                            redirectTo: 'com.privatecharterx.app://auth-callback'
                        }
                    });
                    if (error) throw error;
                    if (data && data.url) {
                        window.webkit.messageHandlers.googleOAuthURL.postMessage({ url: data.url });
                    }
                } catch (e) {
                    console.error('Google OAuth error:', e);
                }
            })();
            """
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    @objc private func performPasswordReset(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let email = userInfo["email"] as? String else { return }

        let js = """
        (async function() {
            try {
                const { error } = await window.supabase.auth.resetPasswordForEmail('\(email.replacingOccurrences(of: "'", with: "\\'"))');
                if (error) throw error;
                window.webkit.messageHandlers.resetResult.postMessage({success: true});
            } catch (e) {
                window.webkit.messageHandlers.resetResult.postMessage({success: false, error: e.message});
            }
        })();
        """

        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("📱 App opened with URL: \(url.absoluteString)")

        // Handle OAuth callback
        if url.scheme == "com.privatecharterx.app" && url.host == "auth-callback" {
            print("✅ OAuth callback received!")
            isDoingGoogleOAuth = false

            // Extract tokens from URL and set session in Supabase
            let js = """
            (async function() {
                // Parse the URL fragment for tokens
                const hash = '\(url.fragment ?? "")';
                if (hash) {
                    const params = new URLSearchParams(hash);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        // Set the session manually
                        await window.supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken
                        });
                        window.location.href = '/dashboard';
                    }
                }
            })();
            """
            webView?.evaluateJavaScript(js, completionHandler: nil)
            return true
        }

        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// MARK: - WKNavigationDelegate
extension AppDelegate: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let path = url.path
        print("🚦 Navigation request to: \(url.absoluteString)")

        // Skip interception during Google OAuth
        if isDoingGoogleOAuth {
            print("⏭️ Allowing - Google OAuth in progress")
            // Check if OAuth completed (landing on dashboard or callback)
            if path == "/dashboard" || path.hasPrefix("/dashboard") {
                isDoingGoogleOAuth = false
                print("✅ Google OAuth successful")
            }
            decisionHandler(.allow)
            return
        }

        // BLOCK navigation to /login - show native instead
        if path == "/login" || path.hasPrefix("/login") {
            print("🛑 BLOCKING /login navigation - showing native login")
            decisionHandler(.cancel)
            DispatchQueue.main.async {
                self.showNativeLogin()
            }
            return
        }

        // BLOCK navigation to /forgot-password - show native instead
        if path == "/forgot-password" || path.hasPrefix("/forgot-password") {
            print("🛑 BLOCKING /forgot-password navigation - showing native forgot password")
            decisionHandler(.cancel)
            DispatchQueue.main.async {
                self.showForgotPasswordAsRoot()
            }
            return
        }

        // Allow all other navigation
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("📄 Page finished loading: \(webView.url?.absoluteString ?? "unknown")")
    }
}

// MARK: - WKScriptMessageHandler
extension AppDelegate: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }

        switch message.name {
        case "nativeAuth":
            if let route = body["route"] as? String {
                DispatchQueue.main.async {
                    if route.contains("login") {
                        self.showNativeLogin()
                    } else if route.contains("forgot") {
                        self.showForgotPasswordAsRoot()
                    }
                }
            }

        case "loginResult":
            let success = body["success"] as? Bool ?? false
            let error = body["error"] as? String
            DispatchQueue.main.async {
                self.loginVC?.loginCompleted(success: success, error: error)
            }

        case "resetResult":
            let success = body["success"] as? Bool ?? false
            let error = body["error"] as? String
            DispatchQueue.main.async {
                self.forgotPasswordVC?.resetCompleted(success: success, error: error)
            }

        case "googleOAuthURL":
            if let urlString = body["url"] as? String, let url = URL(string: urlString) {
                DispatchQueue.main.async {
                    self.startGoogleAuthSession(url: url)
                }
            }

        case "authCheck":
            let isLoggedIn = body["isLoggedIn"] as? Bool ?? false
            let isInitialCheck = body["isInitialCheck"] as? Bool ?? false
            DispatchQueue.main.async {
                if isLoggedIn {
                    print("✅ User is already logged in")
                    // Make sure Capacitor is root and navigate to dashboard
                    if let bridge = self.capacitorBridgeVC {
                        self.window?.rootViewController = bridge
                    }
                    self.webView?.evaluateJavaScript("if(window.location.pathname !== '/dashboard') window.location.href = '/dashboard';", completionHandler: nil)
                } else {
                    print("🔐 User not logged in - showing native login as root")
                    if isInitialCheck {
                        // Replace entire root with login - WebView never visible
                        self.showLoginAsRoot()
                    } else {
                        self.showNativeLogin()
                    }
                }
            }

        default:
            break
        }
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding
extension AppDelegate: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return window ?? UIWindow()
    }

    func startGoogleAuthSession(url: URL) {
        print("🔐 Starting ASWebAuthenticationSession for Google OAuth")

        // Create the authentication session
        authSession = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "com.privatecharterx.app"
        ) { [weak self] callbackURL, error in
            if let error = error {
                print("❌ Google OAuth error: \(error.localizedDescription)")
                return
            }

            if let callbackURL = callbackURL {
                print("✅ Google OAuth callback received: \(callbackURL)")
                // Handle the callback - the app should handle this via URL scheme
                DispatchQueue.main.async {
                    // Navigate to dashboard after successful OAuth
                    self?.webView?.evaluateJavaScript("window.location.href = '/dashboard';", completionHandler: nil)
                }
            }
        }

        authSession?.presentationContextProvider = self
        authSession?.prefersEphemeralWebBrowserSession = false
        authSession?.start()
    }
}
