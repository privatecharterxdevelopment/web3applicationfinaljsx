import UIKit

class ForgotPasswordViewController: UIViewController {

    private let containerView = UIView()
    private let titleLabel = UILabel()
    private let subtitleLabel = UILabel()
    private let emailTextField = UITextField()
    private let sendButton = UIButton(type: .system)
    private let backButton = UIButton(type: .system)
    private let closeButton = UIButton(type: .system)
    private let loadingIndicator = UIActivityIndicatorView(style: .medium)

    // Success state views
    private let successView = UIView()
    private let successIcon = UIImageView()
    private let successTitle = UILabel()
    private let successSubtitle = UILabel()
    private let backToLoginButton = UIButton(type: .system)

    var onClose: (() -> Void)?
    var onBackToLogin: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
    }

    private func setupUI() {
        view.backgroundColor = .white

        // Container
        containerView.backgroundColor = .white
        view.addSubview(containerView)

        // Back button
        backButton.setImage(UIImage(systemName: "arrow.left"), for: .normal)
        backButton.tintColor = .darkGray
        backButton.addTarget(self, action: #selector(backTapped), for: .touchUpInside)
        containerView.addSubview(backButton)

        // Close button
        closeButton.setImage(UIImage(systemName: "xmark"), for: .normal)
        closeButton.tintColor = .darkGray
        closeButton.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        containerView.addSubview(closeButton)

        // Title
        titleLabel.text = "Reset Password"
        titleLabel.font = UIFont.systemFont(ofSize: 28, weight: .semibold)
        titleLabel.textColor = .black
        containerView.addSubview(titleLabel)

        // Subtitle
        subtitleLabel.text = "Enter your email to receive reset instructions"
        subtitleLabel.font = UIFont.systemFont(ofSize: 14, weight: .light)
        subtitleLabel.textColor = .gray
        subtitleLabel.numberOfLines = 0
        containerView.addSubview(subtitleLabel)

        // Email field
        emailTextField.placeholder = "your@email.com"
        emailTextField.borderStyle = .none
        emailTextField.backgroundColor = UIColor(white: 0.96, alpha: 1)
        emailTextField.layer.cornerRadius = 12
        emailTextField.keyboardType = .emailAddress
        emailTextField.autocapitalizationType = .none
        emailTextField.autocorrectionType = .no
        emailTextField.leftView = createIconView(systemName: "envelope")
        emailTextField.leftViewMode = .always
        emailTextField.font = UIFont.systemFont(ofSize: 15)
        containerView.addSubview(emailTextField)

        // Send button
        sendButton.setTitle("Send Reset Email", for: .normal)
        sendButton.backgroundColor = .black
        sendButton.setTitleColor(.white, for: .normal)
        sendButton.layer.cornerRadius = 12
        sendButton.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .medium)
        sendButton.addTarget(self, action: #selector(sendTapped), for: .touchUpInside)
        containerView.addSubview(sendButton)

        // Loading
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.color = .white
        containerView.addSubview(loadingIndicator)

        // Success view (initially hidden)
        successView.isHidden = true
        successView.backgroundColor = .white
        view.addSubview(successView)

        successIcon.image = UIImage(systemName: "checkmark.circle.fill")
        successIcon.tintColor = UIColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 1)
        successIcon.contentMode = .scaleAspectFit
        successView.addSubview(successIcon)

        successTitle.text = "Check Your Email"
        successTitle.font = UIFont.systemFont(ofSize: 24, weight: .semibold)
        successTitle.textColor = .black
        successTitle.textAlignment = .center
        successView.addSubview(successTitle)

        successSubtitle.text = "We've sent password reset instructions to your email."
        successSubtitle.font = UIFont.systemFont(ofSize: 14, weight: .light)
        successSubtitle.textColor = .gray
        successSubtitle.textAlignment = .center
        successSubtitle.numberOfLines = 0
        successView.addSubview(successSubtitle)

        backToLoginButton.setTitle("Back to Login", for: .normal)
        backToLoginButton.backgroundColor = .black
        backToLoginButton.setTitleColor(.white, for: .normal)
        backToLoginButton.layer.cornerRadius = 12
        backToLoginButton.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .medium)
        backToLoginButton.addTarget(self, action: #selector(backToLoginTapped), for: .touchUpInside)
        successView.addSubview(backToLoginButton)
    }

    private func createIconView(systemName: String) -> UIView {
        let container = UIView(frame: CGRect(x: 0, y: 0, width: 44, height: 44))
        let imageView = UIImageView(image: UIImage(systemName: systemName))
        imageView.tintColor = .gray
        imageView.contentMode = .scaleAspectFit
        imageView.frame = CGRect(x: 14, y: 12, width: 18, height: 20)
        container.addSubview(imageView)
        return container
    }

    private func setupConstraints() {
        containerView.translatesAutoresizingMaskIntoConstraints = false
        backButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        emailTextField.translatesAutoresizingMaskIntoConstraints = false
        sendButton.translatesAutoresizingMaskIntoConstraints = false
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        successView.translatesAutoresizingMaskIntoConstraints = false
        successIcon.translatesAutoresizingMaskIntoConstraints = false
        successTitle.translatesAutoresizingMaskIntoConstraints = false
        successSubtitle.translatesAutoresizingMaskIntoConstraints = false
        backToLoginButton.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            // Container
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            containerView.topAnchor.constraint(equalTo: view.topAnchor),
            containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            // Back button
            backButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            backButton.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
            backButton.widthAnchor.constraint(equalToConstant: 32),
            backButton.heightAnchor.constraint(equalToConstant: 32),

            // Close button
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),
            closeButton.widthAnchor.constraint(equalToConstant: 32),
            closeButton.heightAnchor.constraint(equalToConstant: 32),

            // Title
            titleLabel.topAnchor.constraint(equalTo: backButton.bottomAnchor, constant: 32),
            titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 24),

            // Subtitle
            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            subtitleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 24),
            subtitleLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -24),

            // Email
            emailTextField.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 32),
            emailTextField.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 24),
            emailTextField.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -24),
            emailTextField.heightAnchor.constraint(equalToConstant: 52),

            // Send button
            sendButton.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 24),
            sendButton.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 24),
            sendButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -24),
            sendButton.heightAnchor.constraint(equalToConstant: 52),

            // Loading
            loadingIndicator.centerXAnchor.constraint(equalTo: sendButton.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: sendButton.centerYAnchor),

            // Success view
            successView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            successView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            successView.topAnchor.constraint(equalTo: view.topAnchor),
            successView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            successIcon.centerXAnchor.constraint(equalTo: successView.centerXAnchor),
            successIcon.centerYAnchor.constraint(equalTo: successView.centerYAnchor, constant: -80),
            successIcon.widthAnchor.constraint(equalToConstant: 64),
            successIcon.heightAnchor.constraint(equalToConstant: 64),

            successTitle.topAnchor.constraint(equalTo: successIcon.bottomAnchor, constant: 24),
            successTitle.leadingAnchor.constraint(equalTo: successView.leadingAnchor, constant: 24),
            successTitle.trailingAnchor.constraint(equalTo: successView.trailingAnchor, constant: -24),

            successSubtitle.topAnchor.constraint(equalTo: successTitle.bottomAnchor, constant: 12),
            successSubtitle.leadingAnchor.constraint(equalTo: successView.leadingAnchor, constant: 24),
            successSubtitle.trailingAnchor.constraint(equalTo: successView.trailingAnchor, constant: -24),

            backToLoginButton.topAnchor.constraint(equalTo: successSubtitle.bottomAnchor, constant: 32),
            backToLoginButton.leadingAnchor.constraint(equalTo: successView.leadingAnchor, constant: 24),
            backToLoginButton.trailingAnchor.constraint(equalTo: successView.trailingAnchor, constant: -24),
            backToLoginButton.heightAnchor.constraint(equalToConstant: 52),
        ])
    }

    @objc private func backTapped() {
        dismiss(animated: true) {
            self.onBackToLogin?()
        }
    }

    @objc private func closeTapped() {
        dismiss(animated: true) {
            self.onClose?()
        }
    }

    @objc private func sendTapped() {
        guard let email = emailTextField.text, !email.isEmpty else {
            showError("Please enter your email")
            return
        }

        setLoading(true)

        // Call Supabase password reset via NotificationCenter
        NotificationCenter.default.post(
            name: NSNotification.Name("PerformPasswordReset"),
            object: nil,
            userInfo: ["email": email]
        )
    }

    func resetCompleted(success: Bool, error: String?) {
        DispatchQueue.main.async {
            self.setLoading(false)
            if success {
                self.showSuccessState()
            } else {
                self.showError(error ?? "Failed to send reset email")
            }
        }
    }

    private func showSuccessState() {
        containerView.isHidden = true
        successView.isHidden = false
    }

    @objc private func backToLoginTapped() {
        dismiss(animated: true) {
            self.onBackToLogin?()
        }
    }

    private func setLoading(_ loading: Bool) {
        sendButton.setTitle(loading ? "" : "Send Reset Email", for: .normal)
        sendButton.isEnabled = !loading
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
