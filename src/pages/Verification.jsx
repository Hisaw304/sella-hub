import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  CreditCard,
  Upload,
  CheckCircle2,
  Clock3,
  AlertCircle,
  LoaderCircle,
  FileText,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function Verification() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [verification, setVerification] = useState(null);

  const [form, setForm] = useState({
    document_type: "",
    document_number: "",
    date_of_birth: "",
  });

  const [documentFile, setDocumentFile] = useState(null);

  const [documentPreview, setDocumentPreview] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  ========================================
  LOAD VERIFICATION
  ========================================
  */

  useEffect(() => {
    const loadVerification = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login");
          return;
        }

        setUser(user);

        /*
        ========================================
        FETCH VERIFICATION RECORD
        ========================================
        */

        const { data, error: verificationError } = await supabase
          .from("verifications")
          .select(
            `
      id,
      user_id,
      document_type,
      status,
      rejection_reason,
      submitted_at,
      reviewed_at
    `
          )
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (verificationError) {
          throw verificationError;
        }

        setVerification(data);
      } catch (err) {
        console.error("Verification loading error:", err);

        setError(err.message || "Unable to load verification information.");
      } finally {
        setLoading(false);
      }
    };

    loadVerification();
  }, [navigate]);

  /*
  ========================================
  INPUT
  ========================================
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  ========================================
  DOCUMENT
  ========================================
  */

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setDocumentFile(file);

    if (file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);

      setDocumentPreview(preview);
    } else {
      setDocumentPreview("");
    }
  };

  /*
  ========================================
  STATUS
  ========================================
  */

  const status = verification?.status || "not_submitted";

  const isPending = status === "pending";

  const isVerified = status === "verified";

  /*
  ========================================
  SUBMIT VERIFICATION
  ========================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      // 1. Basic validation
      if (!form.document_type) {
        throw new Error("Please select an identification document.");
      }

      if (!form.document_number.trim()) {
        throw new Error("Please enter your document number.");
      }

      if (!form.date_of_birth) {
        throw new Error("Please enter your date of birth.");
      }

      if (!documentFile) {
        throw new Error(
          "Please upload a clear copy of your identification document."
        );
      }

      // 2. File validation
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(documentFile.type)) {
        throw new Error("Please upload a JPG, PNG, WEBP or PDF file.");
      }

      const maxSize = 5 * 1024 * 1024;

      if (documentFile.size > maxSize) {
        throw new Error("The document must be smaller than 5MB.");
      }

      // 3. Check for existing pending verification
      const { data: existingVerification, error: existingError } =
        await supabase
          .from("verifications")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingVerification) {
        throw new Error(
          "You already have a verification request under review."
        );
      }

      // 4. Upload document
      const extension = documentFile.name.split(".").pop().toLowerCase();

      const fileName = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(fileName, documentFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(fileName);

      const documentUrl = publicUrlData?.publicUrl;

      // 5. Create verification record
      const { error: insertError } = await supabase
        .from("verifications")
        .insert({
          user_id: user.id,
          document_type: form.document_type,
          document_number: form.document_number.trim(),
          date_of_birth: form.date_of_birth,
          document_path: fileName,
          document_url: documentUrl,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      // 6. Update UI
      setSuccess("Your verification request has been submitted successfully.");

      setVerification({
        status: "pending",
        document_type: form.document_type,
        submitted_at: new Date().toISOString(),
      });

      setForm({
        document_type: "",
        document_number: "",
        date_of_birth: "",
      });

      setDocumentFile(null);
      setDocumentPreview("");
    } catch (err) {
      console.error("Verification submission error:", err);

      setError(err.message || "Unable to submit your verification.");
    } finally {
      setSubmitting(false);
    }
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <div className="sh-verification-loading">
        <LoaderCircle size={24} className="sh-verification-spinner" />

        <p>Loading verification...</p>
      </div>
    );
  }

  /*
  ========================================
  PAGE
  ========================================
  */

  return (
    <div className="sh-verification-page">
      <div className="sh-verification-container">
        {/* HEADER */}

        <header className="sh-verification-header">
          <Link to="/dashboard/profile" className="sh-verification-back">
            <ArrowLeft size={16} />
            Back to profile
          </Link>

          <div className="sh-verification-title">
            <div className="sh-verification-title-icon">
              <ShieldCheck size={23} />
            </div>

            <div>
              <span>Seller verification</span>

              <h1>Verify your account</h1>

              <p>Build trust with buyers by verifying your identity.</p>
            </div>
          </div>
        </header>

        {/* STATUS */}

        {isVerified ? (
          <section className="sh-verification-status sh-verification-status-success">
            <div className="sh-verification-status-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>Verified seller</span>

              <h2>Your account is verified</h2>

              <p>
                Buyers can see that your seller account has been verified by
                SellaHub.
              </p>
            </div>
          </section>
        ) : isPending ? (
          <section className="sh-verification-status sh-verification-status-pending">
            <div className="sh-verification-status-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <span>Verification pending</span>

              <h2>Your documents are being reviewed</h2>

              <p>
                We will update your account once the verification review is
                complete.
              </p>
            </div>
          </section>
        ) : null}

        {/* INFORMATION */}

        {!isPending && !isVerified && (
          <section className="sh-verification-info">
            <div className="sh-verification-info-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Why verify your account?</h2>

              <p>
                Verification helps create a safer marketplace and gives buyers
                more confidence when dealing with sellers.
              </p>

              <ul>
                <li>
                  <CheckCircle2 size={15} />
                  Display a verified seller badge
                </li>

                <li>
                  <CheckCircle2 size={15} />
                  Build trust with potential buyers
                </li>

                <li>
                  <CheckCircle2 size={15} />
                  Strengthen your seller profile
                </li>
              </ul>
            </div>
          </section>
        )}

        {/* REJECTION */}

        {verification?.status === "rejected" && (
          <section className="sh-verification-rejected">
            <div className="sh-verification-rejected-icon">
              <AlertCircle size={19} />
            </div>

            <div>
              <span>Verification unsuccessful</span>

              <h2>Additional information required</h2>

              <p>
                {verification.rejection_reason ||
                  "Your verification could not be completed. Please review your information and submit again."}
              </p>
            </div>
          </section>
        )}

        {/* FORM */}

        {!isPending && !isVerified && (
          <form className="sh-verification-form" onSubmit={handleSubmit}>
            {/* IDENTITY */}

            <section className="sh-verification-card">
              <div className="sh-verification-card-header">
                <div className="sh-verification-step">01</div>

                <div>
                  <span>Identification</span>

                  <h2>Identity information</h2>

                  <p>
                    Enter the details exactly as they appear on your document.
                  </p>
                </div>
              </div>

              {/* DOCUMENT TYPE */}

              <div className="sh-verification-field">
                <label htmlFor="document_type">Identification document</label>

                <div className="sh-verification-input">
                  <CreditCard size={17} />

                  <select
                    id="document_type"
                    name="document_type"
                    value={form.document_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select document</option>

                    <option value="nin">NIN</option>

                    <option value="international_passport">
                      International Passport
                    </option>

                    <option value="drivers_license">Driver's License</option>

                    <option value="voters_card">Voter's Card</option>
                  </select>
                </div>
              </div>

              {/* DOCUMENT NUMBER */}

              <div className="sh-verification-field">
                <label htmlFor="document_number">Document number</label>

                <div className="sh-verification-input">
                  <FileText size={17} />

                  <input
                    id="document_number"
                    name="document_number"
                    type="text"
                    value={form.document_number}
                    onChange={handleChange}
                    placeholder="Enter document number"
                    autoComplete="off"
                    required
                  />
                </div>

                <small>
                  Make sure the number matches the document you upload.
                </small>
              </div>

              {/* DOB */}

              <div className="sh-verification-field">
                <label htmlFor="date_of_birth">Date of birth</label>

                <div className="sh-verification-input">
                  <User size={17} />

                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* DOCUMENT */}

            <section className="sh-verification-card">
              <div className="sh-verification-card-header">
                <div className="sh-verification-step">02</div>

                <div>
                  <span>Document</span>

                  <h2>Upload identification</h2>

                  <p>
                    Upload a clear image or PDF of your identification document.
                  </p>
                </div>
              </div>

              <label className="sh-verification-upload">
                {documentPreview ? (
                  <img src={documentPreview} alt="Document preview" />
                ) : (
                  <>
                    <div className="sh-verification-upload-icon">
                      <Upload size={21} />
                    </div>

                    <strong>Upload your document</strong>

                    <span>JPG, PNG, WEBP or PDF · Maximum 5MB</span>
                  </>
                )}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleDocumentChange}
                  required
                />
              </label>

              {documentFile && (
                <div className="sh-verification-file">
                  <FileText size={16} />

                  <span>{documentFile.name}</span>
                </div>
              )}
            </section>

            {/* SECURITY NOTE */}

            <div className="sh-verification-security">
              <ShieldCheck size={18} />

              <p>
                Your verification information is used only for identity
                verification and is not displayed publicly on your seller
                profile.
              </p>
            </div>

            {/* MESSAGES */}

            {error && (
              <div className="sh-verification-message sh-verification-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="sh-verification-message sh-verification-success">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            {/* ACTION */}

            <div className="sh-verification-actions">
              <Link to="/dashboard/profile" className="sh-verification-cancel">
                Cancel
              </Link>

              <button
                type="submit"
                className="sh-verification-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="sh-verification-spinner"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Submit for verification
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
