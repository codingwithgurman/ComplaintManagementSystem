"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import AppShell from "@/components/AppShell";
import Field from "@/components/Field";
import { isRequired, minLength } from "@/lib/validate";
import { CATEGORIES, createComplaint, uploadComplaintImage, fetchDepartments, displayId } from "@/lib/data";

export default function NewComplaintPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(""); // no default — user must choose
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchDepartments().then((d) => setDepartments(d)).catch(() => {});
  }, []);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast("Image must be under 3MB.", "error");
      e.target.value = "";
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!isRequired(title)) nextErrors.title = "Give your complaint a short title.";
    if (!isRequired(category)) nextErrors.category = "Select a category.";
    if (!isRequired(department)) nextErrors.department = "Select a department.";
    if (!minLength(description, 20)) nextErrors.description = "Please add a description (min. 20 characters).";
    if (!priority) nextErrors.priority = "Please select a priority level.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast("Please fix the highlighted fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) imageUrl = await uploadComplaintImage(imageFile, user.id);

      const record = await createComplaint({
        title: title.trim(),
        category,
        department,
        description: description.trim(),
        priority,
        image_url: imageUrl,
        status: "Pending",
        student_id: user.id,
        student_name: profile?.name || "Student",
        student_roll: profile?.roll || null,
      });

      setSuccess(record);
      setTitle(""); setCategory(""); setDepartment(""); setDescription("");
      setPriority(""); setImageFile(null); setImagePreview(null);
    } catch (err) {
      toast(err.message || "Could not submit complaint.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="New Complaint" requiredRole="student">
      <div className="content" style={{ maxWidth: 760, padding: 0 }}>
        <div className="panel">
          <div className="panel-head">
            <h2>Tell us what went wrong</h2>
            <span className="eyebrow">A ticket ID is generated on submit</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <Field id="title" label="Complaint title" error={errors.title}>
              <input type="text" id="title" placeholder="e.g. Wi-Fi not working in Block C" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <div className="form-row">
              <Field id="category" label="Complaint category" error={errors.category}>
                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field id="department" label="Department" error={errors.department}>
                <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id}>{d.name}</option>)}
                </select>
              </Field>
            </div>

            <Field id="description" label="Description" error={errors.description}>
              <textarea
                id="description" maxLength={600} placeholder="Describe the issue in detail — what happened, when, and where."
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
              <div className="char-counter">{description.length} / 600 characters</div>
            </Field>

            <div className={`field ${errors.priority ? "has-error" : ""}`}>
              <label>Priority</label>
              <div className="priority-options">
                {["Low", "Medium", "High"].map((p) => (
                  <label key={p} className={`priority-option ${priority === p ? "selected" : ""}`}>
                    <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} />
                    {p}
                  </label>
                ))}
              </div>
              {errors.priority && <span className="error" style={{ display: "block" }}>{errors.priority}</span>}
            </div>

            <div className="field">
              <label>Upload image (optional)</label>
              <label className="image-drop">
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <span>{imageFile ? imageFile.name : "Click to upload a photo of the issue — JPG or PNG, up to 3MB"}</span>
              </label>
              {imagePreview && (
                <div className="preview-thumb" style={{ display: "block" }}>
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit complaint"}
            </button>
          </form>
        </div>
      </div>

      {success && (
        <div className="modal-overlay open">
          <div className="modal" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>&#127881;</div>
            <h3>Complaint submitted</h3>
            <p>Your ticket <b className="mono">{displayId(success.id)}</b> has been logged and is now <b>Pending</b> review.</p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => router.push("/complaints")}>View my complaints</button>
              <button className="btn btn-outline" onClick={() => setSuccess(null)}>File another</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
