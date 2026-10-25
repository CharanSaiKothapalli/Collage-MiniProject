# KEYTRACE Machine Learning Methodology & Evaluation

**Academic Title**: A Keystroke-Dynamics Classifier for Continuous Behavioural User Authentication  
**Service**: Python 3.9+ / FastAPI / scikit-learn / NumPy / Pydantic  
**Microservice URL**: `http://localhost:8000` (Internal to backend network)

---

## 1. Biometric Keystroke Dynamics Background

Keystroke dynamics is a behavioural biometric modality based on measuring the habitual rhythm and timing characteristics of an individual typing on a keyboard. Unlike physiological biometrics (fingerprint, iris), keystroke dynamics:
- Operates passively and continuously without specialized hardware sensors.
- Exhibits natural variance across time, cognitive load, physical posture, and fatigue.
- Serves as a **probabilistic risk signal**, not an infallible proof of physical identity.

---

## 2. Feature Extraction & Canonical Schema

KEYTRACE standardizes all feature vectors into a 10-dimensional space defined in `@keytrace/shared`:

| Feature Name | Dimension | Formula / Definition | Unit | Physical Significance |
|---|---|---|---|---|
| `mean_hold` | 1 | $\frac{1}{N}\sum t_{\text{up}} - t_{\text{down}}$ | ms | Average duration individual keys are depressed. |
| `std_hold` | 2 | $\sqrt{\frac{1}{N}\sum (\text{hold}_i - \overline{\text{hold}})^2}$ | ms | Hold-time consistency/variability. |
| `median_hold` | 3 | $P_{50}(\text{hold})$ | ms | Outlier-resistant central tendency of hold duration. |
| `mean_flight` | 4 | $\frac{1}{N-1}\sum t_{\text{down}, i+1} - t_{\text{up}, i}$ | ms | Inter-key transition time between successive strokes. |
| `std_flight` | 5 | $\sqrt{\frac{1}{N-1}\sum (\text{flight}_i - \overline{\text{flight}})^2}$ | ms | Rhythm fluctuation across transitions. |
| `median_flight` | 6 | $P_{50}(\text{flight})$ | ms | Typical inter-key delay. |
| `p90_flight` | 7 | $P_{90}(\text{flight})$ | ms | 90th percentile flight time (captures deliberate pauses). |
| `chars_per_second` | 8 | $\frac{N}{\text{elapsedMs} / 1000.0}$ | chars/sec | Overall net typing cadence. |
| `pause_ratio` | 9 | $\frac{\sum \text{flight}_i \cdot \mathbb{I}(\text{flight}_i > 250\text{ms})}{\text{elapsedMs}}$ | ratio [0, 1] | Proportion of session spent in hesitation pauses. |
| `hold_flight_ratio` | 10 | $\frac{\text{median\_hold}}{\max(\text{median\_flight}, 1.0)}$ | ratio | Ratio of finger contact duration to transition duration. |

### Physical Plausibility Filters
Physical finger movements on tactile or virtual keys are constrained by human biomechanics:
- Individual key hold durations must fall within `[10ms, 1500ms]`.
- Inter-key flight durations must fall within `[-500ms, 3000ms]` (negative values occur during rollover keying where the subsequent key is depressed before the prior key is released).
- Measurements outside these bounds are discarded as hardware artifacts or network latency noise.

---

## 3. Modeling Philosophy: Why Not Generic Multi-Class Classification?

In a closed academic experiment, a multi-class Random Forest or SVM can achieve artificially high accuracy simply by classifying among $K$ known enrolled users. 

However, in **real-world authentication systems**, the operational threat model is fundamentally **open-set**:
1. An attacker (impostor) is rarely an enrolled account in the system database.
2. The model must evaluate whether an active session conforms to **one specific genuine account's profile** without having access to the universe of all possible impostor styles.
3. Therefore, KEYTRACE implements **one-class personalized behavioural modeling** combining:
   - **Personalized Robust Distance (Median + Median Absolute Deviation)**
   - **Isolation Forest Anomaly Detection**

---

## 4. Personalized Robust Distance Formulation

For an enrolled user with $S$ enrollment feature vectors $\mathbf{x}^{(1)}, \dots, \mathbf{x}^{(S)} \in \mathbb{R}^{10}$, we estimate the user's reference parameters per dimension $j \in \{1, \dots, 10\}$:

$$\tilde{\mu}_j = \text{median}(\{x_j^{(s)}\}_{s=1}^S)$$

$$\text{MAD}_j = \text{median}(\{|x_j^{(s)} - \tilde{\mu}_j|\}_{s=1}^S)$$

To prevent numerical divergence when a user types with extreme robotic regularity ($\text{MAD}_j \to 0$), we enforce a scale floor $\sigma_j$:

$$\sigma_j = \max(\text{MAD}_j, |\tilde{\mu}_j| \cdot 0.05, 1.0)$$

For an incoming test window $\mathbf{z} \in \mathbb{R}^{10}$, the normalized z-score per feature is:

$$z_j = \min\left(\frac{|z_j - \tilde{\mu}_j|}{\sigma_j}, 10.0\right)$$

The aggregate anomaly distance score is the Euclidean norm across all dimensions:

$$D(\mathbf{z}) = \sqrt{\frac{1}{10} \sum_{j=1}^{10} z_j^2}$$

### Decision Boundary
- **`MATCH`**: $D(\mathbf{z}) \le \tau_{\text{decision}}$ (Default calibrated $\tau = 2.80$).
- **`REVIEW`**: $D(\mathbf{z}) > \tau_{\text{decision}}$.

---

## 5. Offline Evaluation Protocol: FAR, FRR, EER, and ROC-AUC

Model performance is evaluated across independent, held-out sessions:
1. **False Rejection Rate (FRR)**: Proportion of genuine user sessions incorrectly classified as `REVIEW`.
   $$\text{FRR} = \frac{\text{False Negatives}}{\text{Total Genuine Attempts}}$$
2. **False Acceptance Rate (FAR)**: Proportion of impostor sessions incorrectly accepted as `MATCH`.
   $$\text{FAR} = \frac{\text{False Positives}}{\text{Total Impostor Attempts}}$$
3. **Equal Error Rate (EER)**: Operating threshold where $\text{FAR} \approx \text{FRR}$.
4. **ROC-AUC**: Area under the Receiver Operating Characteristic curve constructed by sweeping the threshold $\tau \in [0, 10]$.

Evaluation reports are generated offline using `POST /api/v1/evaluate` with held-out genuine and impostor sets. In test validations with calibrated profiles, baseline robust distance achieves EER $\le 10\%$ and ROC-AUC $\ge 0.95$.
