import UIKit

class LoginViewController: UIViewController {

    private let logoImageView = UIImageView()
    private let helloLabel = UILabel()
    private let emailButton = UIButton(type: .system)

    // Typing animation
    private var typingTimer: Timer?
    private let wordsScreen1 = ["Hello.", "Travel?", "Fly?", "Escape?"]
    private let wordsScreen2 = ["excited.", "lets go."]
    private var currentWords: [String] = []
    private var currentWordIndex = 0
    private var currentCharIndex = 0
    private var isDeleting = false
    private let googleButton = UIButton(type: .system)
    private let termsLabel = UILabel()
    private let loadingIndicator = UIActivityIndicatorView(style: .medium)

    // Email login form
    private let emailFormContainer = UIView()
    private let emailTextField = UITextField()
    private let passwordTextField = UITextField()
    private let signInButton = UIButton(type: .system)
    private let backButton = UIButton(type: .system)
    private let forgotPasswordButton = UIButton(type: .system)
    private var isShowingEmailForm = false

    var onLoginSuccess: (() -> Void)?
    var onClose: (() -> Void)?
    var onForgotPassword: (() -> Void)?
    var onCreateAccount: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
        startTypingAnimation(forScreen2: false)
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        typingTimer?.invalidate()
    }

    private func startTypingAnimation(forScreen2: Bool = false) {
        helloLabel.text = ""
        currentWords = forScreen2 ? wordsScreen2 : wordsScreen1
        currentWordIndex = 0
        currentCharIndex = 0
        isDeleting = false
        scheduleNextTick()
    }

    private func scheduleNextTick() {
        let delay: TimeInterval
        if isDeleting {
            delay = 0.05 // Faster when deleting
        } else {
            delay = 0.1 // Normal typing speed
        }

        typingTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
            self?.animateTyping()
        }
    }

    private func animateTyping() {
        guard !currentWords.isEmpty else { return }
        let currentWord = currentWords[currentWordIndex]

        if isDeleting {
            // Remove character
            if currentCharIndex > 0 {
                currentCharIndex -= 1
                let index = currentWord.index(currentWord.startIndex, offsetBy: currentCharIndex)
                helloLabel.text = String(currentWord[..<index])
                scheduleNextTick()
            } else {
                // Done deleting, move to next word
                isDeleting = false
                currentWordIndex = (currentWordIndex + 1) % currentWords.count
                typingTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: false) { [weak self] _ in
                    self?.scheduleNextTick()
                }
            }
        } else {
            // Add character
            if currentCharIndex < currentWord.count {
                currentCharIndex += 1
                let index = currentWord.index(currentWord.startIndex, offsetBy: currentCharIndex)
                helloLabel.text = String(currentWord[..<index])
                scheduleNextTick()
            } else {
                // Done typing, wait then delete
                typingTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: false) { [weak self] _ in
                    self?.isDeleting = true
                    self?.scheduleNextTick()
                }
            }
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }

    private func setupUI() {
        // Light gray background
        view.backgroundColor = UIColor(red: 0.93, green: 0.94, blue: 0.96, alpha: 1.0)

        // Logo at top
        if let logo = UIImage(named: "Logo") {
            logoImageView.image = logo
        }
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.clipsToBounds = true
        view.addSubview(logoImageView)

        // Hello text (animated)
        helloLabel.text = ""
        helloLabel.font = UIFont.systemFont(ofSize: 48, weight: .medium)
        helloLabel.textColor = .black
        helloLabel.textAlignment = .center
        view.addSubview(helloLabel)

        // Continue with Email button (filled black)
        emailButton.setTitle("Continue with Email", for: .normal)
        emailButton.backgroundColor = .black
        emailButton.setTitleColor(.white, for: .normal)
        emailButton.layer.cornerRadius = 28
        emailButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        emailButton.addTarget(self, action: #selector(emailTapped), for: .touchUpInside)
        view.addSubview(emailButton)

        // Email form container (hidden initially)
        emailFormContainer.alpha = 0
        emailFormContainer.isHidden = true
        view.addSubview(emailFormContainer)

        // Email text field
        emailTextField.placeholder = "Email"
        emailTextField.borderStyle = .none
        emailTextField.backgroundColor = .white
        emailTextField.layer.cornerRadius = 14
        emailTextField.keyboardType = .emailAddress
        emailTextField.autocapitalizationType = .none
        emailTextField.autocorrectionType = .no
        emailTextField.font = UIFont.systemFont(ofSize: 16)
        emailTextField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 20, height: 0))
        emailTextField.leftViewMode = .always
        emailFormContainer.addSubview(emailTextField)

        // Password text field
        passwordTextField.placeholder = "Password"
        passwordTextField.borderStyle = .none
        passwordTextField.backgroundColor = .white
        passwordTextField.layer.cornerRadius = 14
        passwordTextField.isSecureTextEntry = true
        passwordTextField.font = UIFont.systemFont(ofSize: 16)
        passwordTextField.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 20, height: 0))
        passwordTextField.leftViewMode = .always
        emailFormContainer.addSubview(passwordTextField)

        // Sign In button
        signInButton.setTitle("Sign In", for: .normal)
        signInButton.backgroundColor = .black
        signInButton.setTitleColor(.white, for: .normal)
        signInButton.layer.cornerRadius = 28
        signInButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        signInButton.addTarget(self, action: #selector(signInTapped), for: .touchUpInside)
        emailFormContainer.addSubview(signInButton)

        // Back button (top left, next to logo)
        backButton.setTitle("←", for: .normal)
        backButton.setTitleColor(.black, for: .normal)
        backButton.titleLabel?.font = UIFont.systemFont(ofSize: 24, weight: .medium)
        backButton.addTarget(self, action: #selector(backTapped), for: .touchUpInside)
        backButton.alpha = 0
        backButton.isHidden = true
        view.addSubview(backButton)

        // Forgot password button
        forgotPasswordButton.setTitle("Forgot password?", for: .normal)
        forgotPasswordButton.setTitleColor(.gray, for: .normal)
        forgotPasswordButton.titleLabel?.font = UIFont.systemFont(ofSize: 13)
        forgotPasswordButton.addTarget(self, action: #selector(forgotPasswordTapped), for: .touchUpInside)
        emailFormContainer.addSubview(forgotPasswordButton)

        // Continue with Google button (outlined)
        googleButton.setTitle("Continue with Google", for: .normal)
        googleButton.backgroundColor = .clear
        googleButton.setTitleColor(.black, for: .normal)
        googleButton.layer.cornerRadius = 28
        googleButton.layer.borderWidth = 1.5
        googleButton.layer.borderColor = UIColor.black.cgColor
        googleButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        googleButton.addTarget(self, action: #selector(googleTapped), for: .touchUpInside)
        view.addSubview(googleButton)

        // Terms text
        let termsText = "By pressing on \"Continue with...\" you agree to our\nPrivacy Policy and Terms and Conditions"
        let attributedString = NSMutableAttributedString(string: termsText)

        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        paragraphStyle.lineSpacing = 4

        attributedString.addAttribute(.paragraphStyle, value: paragraphStyle, range: NSRange(location: 0, length: termsText.count))
        attributedString.addAttribute(.foregroundColor, value: UIColor.darkGray, range: NSRange(location: 0, length: termsText.count))
        attributedString.addAttribute(.font, value: UIFont.systemFont(ofSize: 12, weight: .regular), range: NSRange(location: 0, length: termsText.count))

        // Make "Privacy Policy" and "Terms and Conditions" bold
        if let privacyRange = termsText.range(of: "Privacy Policy") {
            let nsRange = NSRange(privacyRange, in: termsText)
            attributedString.addAttribute(.font, value: UIFont.systemFont(ofSize: 12, weight: .semibold), range: nsRange)
        }
        if let termsRange = termsText.range(of: "Terms and Conditions") {
            let nsRange = NSRange(termsRange, in: termsText)
            attributedString.addAttribute(.font, value: UIFont.systemFont(ofSize: 12, weight: .semibold), range: nsRange)
        }

        termsLabel.attributedText = attributedString
        termsLabel.numberOfLines = 0
        termsLabel.textAlignment = .center
        view.addSubview(termsLabel)

        // Loading indicator
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.color = .white
        view.addSubview(loadingIndicator)
    }

    private func setupConstraints() {
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        helloLabel.translatesAutoresizingMaskIntoConstraints = false
        emailButton.translatesAutoresizingMaskIntoConstraints = false
        googleButton.translatesAutoresizingMaskIntoConstraints = false
        termsLabel.translatesAutoresizingMaskIntoConstraints = false
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        emailFormContainer.translatesAutoresizingMaskIntoConstraints = false
        emailTextField.translatesAutoresizingMaskIntoConstraints = false
        passwordTextField.translatesAutoresizingMaskIntoConstraints = false
        signInButton.translatesAutoresizingMaskIntoConstraints = false
        backButton.translatesAutoresizingMaskIntoConstraints = false
        forgotPasswordButton.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            // Logo at top
            logoImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 40),
            logoImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logoImageView.widthAnchor.constraint(equalToConstant: 48),
            logoImageView.heightAnchor.constraint(equalToConstant: 48),

            // Hello centered in upper portion
            helloLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            helloLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -60),

            // Email button
            emailButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            emailButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            emailButton.heightAnchor.constraint(equalToConstant: 56),
            emailButton.bottomAnchor.constraint(equalTo: googleButton.topAnchor, constant: -12),

            // Google button
            googleButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            googleButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            googleButton.heightAnchor.constraint(equalToConstant: 56),
            googleButton.bottomAnchor.constraint(equalTo: termsLabel.topAnchor, constant: -20),

            // Terms label
            termsLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            termsLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            termsLabel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),

            // Loading indicator
            loadingIndicator.centerXAnchor.constraint(equalTo: signInButton.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: signInButton.centerYAnchor),

            // Back button - top left, same level as logo
            backButton.centerYAnchor.constraint(equalTo: logoImageView.centerYAnchor),
            backButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            backButton.widthAnchor.constraint(equalToConstant: 44),
            backButton.heightAnchor.constraint(equalToConstant: 44),

            // Email form container - positioned at bottom like the buttons
            emailFormContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            emailFormContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            emailFormContainer.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),

            // Email field (at the top of form, same position as email button)
            emailTextField.topAnchor.constraint(equalTo: emailFormContainer.topAnchor),
            emailTextField.leadingAnchor.constraint(equalTo: emailFormContainer.leadingAnchor),
            emailTextField.trailingAnchor.constraint(equalTo: emailFormContainer.trailingAnchor),
            emailTextField.heightAnchor.constraint(equalToConstant: 52),

            // Password field
            passwordTextField.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 12),
            passwordTextField.leadingAnchor.constraint(equalTo: emailFormContainer.leadingAnchor),
            passwordTextField.trailingAnchor.constraint(equalTo: emailFormContainer.trailingAnchor),
            passwordTextField.heightAnchor.constraint(equalToConstant: 52),

            // Sign in button
            signInButton.topAnchor.constraint(equalTo: passwordTextField.bottomAnchor, constant: 16),
            signInButton.leadingAnchor.constraint(equalTo: emailFormContainer.leadingAnchor),
            signInButton.trailingAnchor.constraint(equalTo: emailFormContainer.trailingAnchor),
            signInButton.heightAnchor.constraint(equalToConstant: 56),

            // Forgot password - below sign in
            forgotPasswordButton.topAnchor.constraint(equalTo: signInButton.bottomAnchor, constant: 16),
            forgotPasswordButton.centerXAnchor.constraint(equalTo: emailFormContainer.centerXAnchor),
            forgotPasswordButton.bottomAnchor.constraint(equalTo: emailFormContainer.bottomAnchor),
        ])
    }

    @objc private func emailTapped() {
        // Show email form with animation
        isShowingEmailForm = true
        emailFormContainer.isHidden = false
        backButton.isHidden = false

        // Switch to screen 2 words
        typingTimer?.invalidate()
        startTypingAnimation(forScreen2: true)

        UIView.animate(withDuration: 0.3) {
            self.emailButton.alpha = 0
            self.googleButton.alpha = 0
            self.termsLabel.alpha = 0
            self.emailFormContainer.alpha = 1
            self.backButton.alpha = 1
        }

        emailTextField.becomeFirstResponder()
    }

    @objc private func backTapped() {
        // Hide email form
        isShowingEmailForm = false
        view.endEditing(true)

        // Switch back to screen 1 words
        typingTimer?.invalidate()
        startTypingAnimation(forScreen2: false)

        UIView.animate(withDuration: 0.3) {
            self.emailButton.alpha = 1
            self.googleButton.alpha = 1
            self.termsLabel.alpha = 1
            self.emailFormContainer.alpha = 0
            self.backButton.alpha = 0
        } completion: { _ in
            self.emailFormContainer.isHidden = true
            self.backButton.isHidden = true
        }
    }

    @objc private func signInTapped() {
        guard let email = emailTextField.text, !email.isEmpty,
              let password = passwordTextField.text, !password.isEmpty else {
            showError("Please enter email and password")
            return
        }

        setLoading(true)
        view.endEditing(true)

        // Call Supabase auth via NotificationCenter
        NotificationCenter.default.post(
            name: NSNotification.Name("PerformLogin"),
            object: nil,
            userInfo: ["email": email, "password": password]
        )
    }

    @objc private func forgotPasswordTapped() {
        onForgotPassword?()
    }

    @objc private func googleTapped() {
        // Trigger Google OAuth via NotificationCenter -> AppDelegate -> WebView
        NotificationCenter.default.post(
            name: NSNotification.Name("PerformGoogleLogin"),
            object: nil
        )
    }

    func loginCompleted(success: Bool, error: String?) {
        DispatchQueue.main.async {
            self.setLoading(false)
            if success {
                self.dismiss(animated: true) {
                    self.onLoginSuccess?()
                }
            } else {
                self.showError(error ?? "Login failed")
            }
        }
    }

    private func setLoading(_ loading: Bool) {
        signInButton.setTitle(loading ? "" : "Sign In", for: .normal)
        signInButton.isEnabled = !loading
        emailTextField.isEnabled = !loading
        passwordTextField.isEnabled = !loading
        backButton.isEnabled = !loading
        if loading {
            loadingIndicator.startAnimating()
        } else {
            loadingIndicator.stopAnimating()
        }
    }

    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
