import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Save,
  LoaderCircle,
  Package,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    description: "",
    price: "",
    price_type: "fixed",
    location: "",
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  ========================================
  LOAD LISTING
  ========================================
  */

  useEffect(() => {
    const loadListing = async () => {
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

        /*
        ========================================
        FETCH CATEGORIES
        ========================================
        */

        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", {
            ascending: true,
          });

        if (categoryError) {
          throw categoryError;
        }

        setCategories(categoryData || []);

        /*
        ========================================
        FETCH LISTING
        ========================================
        */

        const { data: listing, error: listingError } = await supabase
          .from("listings")
          .select(
            `
            id,
            user_id,
            title,
            category_id,
            description,
            price,
            price_type,
            location,
            status,
            listing_images (
              id,
              image_url,
              sort_order
            )
          `
          )
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (listingError) {
          throw listingError;
        }

        if (!listing) {
          throw new Error("Listing could not be found.");
        }

        setFormData({
          title: listing.title || "",
          category_id: listing.category_id || "",
          description: listing.description || "",
          price: listing.price ?? "",
          price_type: listing.price_type || "fixed",
          location: listing.location || "",
        });

        const sortedImages = [...(listing.listing_images || [])].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );

        setExistingImages(sortedImages);
      } catch (err) {
        console.error("Edit listing load error:", err);

        setError(err.message || "Unable to load this listing.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadListing();
    }
  }, [id, navigate]);

  /*
  ========================================
  INPUT CHANGE
  ========================================
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  ========================================
  ADD NEW IMAGES
  ========================================
  */

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) return;

    setImages((current) => [...current, ...selectedFiles]);

    e.target.value = "";
  };

  /*
  ========================================
  REMOVE EXISTING IMAGE
  ========================================
  */

  const removeExistingImage = (imageId) => {
    setExistingImages((current) =>
      current.filter((image) => image.id !== imageId)
    );
  };

  /*
  ========================================
  REMOVE NEW IMAGE
  ========================================
  */

  const removeNewImage = (index) => {
    setImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  /*
  ========================================
  UPLOAD IMAGE
  ========================================
  */

  const uploadImage = async (file, userId) => {
    const extension = file.name.split(".").pop();

    const fileName = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-images").getPublicUrl(fileName);

    return publicUrl;
  };

  /*
  ========================================
  SAVE LISTING
  ========================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

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

      /*
      ========================================
      VALIDATION
      ========================================
      */

      if (!formData.title.trim()) {
        throw new Error("Please enter a listing title.");
      }

      if (!formData.category_id) {
        throw new Error("Please select a category.");
      }

      if (!formData.description.trim()) {
        throw new Error("Please enter a description.");
      }

      if (!formData.price || Number(formData.price) <= 0) {
        throw new Error("Please enter a valid price.");
      }

      if (!formData.location.trim()) {
        throw new Error("Please enter a location.");
      }

      /*
      ========================================
      UPDATE LISTING
      ========================================
      */

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          title: formData.title.trim(),
          category_id: formData.category_id,
          description: formData.description.trim(),
          price: Number(formData.price),
          price_type: formData.price_type,
          location: formData.location.trim(),

          /*
            Send listing back for review
            after meaningful edits.
            */
          status: "pending",
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      /*
      ========================================
      REMOVE DELETED EXISTING IMAGES
      ========================================
      */

      const { data: currentImages, error: currentImagesError } = await supabase
        .from("listing_images")
        .select("id, image_url")
        .eq("listing_id", id);

      if (currentImagesError) {
        throw currentImagesError;
      }

      const remainingIds = existingImages.map((image) => image.id);

      const imagesToDelete = (currentImages || []).filter(
        (image) => !remainingIds.includes(image.id)
      );

      if (imagesToDelete.length) {
        const idsToDelete = imagesToDelete.map((image) => image.id);

        const { error: deleteError } = await supabase
          .from("listing_images")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          throw deleteError;
        }
      }

      /*
      ========================================
      UPLOAD NEW IMAGES
      ========================================
      */

      if (images.length) {
        for (let i = 0; i < images.length; i++) {
          const imageUrl = await uploadImage(images[i], user.id);

          const maxSortOrder = existingImages.length + i;

          const { error: imageInsertError } = await supabase
            .from("listing_images")
            .insert({
              listing_id: id,
              image_url: imageUrl,
              sort_order: maxSortOrder,
            });

          if (imageInsertError) {
            throw imageInsertError;
          }
        }
      }

      setSuccess("Listing updated successfully. It has been sent for review.");

      setImages([]);

      /*
      ========================================
      REDIRECT
      ========================================
      */

      setTimeout(() => {
        navigate("/dashboard/my-listings");
      }, 1200);
    } catch (err) {
      console.error("Edit listing error:", err);

      setError(err.message || "Unable to update listing.");
    } finally {
      setSaving(false);
    }
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <div className="sh-edit-listing-loading">
        <LoaderCircle size={24} className="sh-edit-listing-spinner" />

        <p>Loading listing...</p>
      </div>
    );
  }

  /*
  ========================================
  PAGE
  ========================================
  */

  return (
    <div className="sh-edit-listing-page">
      <div className="sh-edit-listing-container">
        {/* HEADER */}

        <header className="sh-edit-listing-header">
          <Link to="/dashboard/my-listings" className="sh-edit-listing-back">
            <ArrowLeft size={16} />
            Back to my listings
          </Link>

          <div className="sh-edit-listing-heading">
            <span>Marketplace</span>

            <h1>Edit listing</h1>

            <p>
              Update your listing information and keep your details accurate.
            </p>
          </div>
        </header>

        {/* FORM */}

        <form className="sh-edit-listing-form" onSubmit={handleSubmit}>
          {/* LISTING INFORMATION */}

          <section className="sh-edit-listing-card">
            <div className="sh-edit-listing-card-header">
              <div>
                <span>Listing information</span>

                <h2>Basic details</h2>
              </div>
            </div>

            {/* TITLE */}

            <div className="sh-edit-field">
              <label htmlFor="title">Listing title</label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="What are you selling?"
                required
              />
            </div>

            {/* CATEGORY */}

            <div className="sh-edit-field">
              <label htmlFor="category_id">Category</label>

              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIPTION */}

            <div className="sh-edit-field">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product or service..."
                rows={7}
                required
              />
            </div>

            {/* PRICE */}

            <div className="sh-edit-field-grid">
              <div className="sh-edit-field">
                <label htmlFor="price">Price</label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="85000"
                  required
                />
              </div>

              <div className="sh-edit-field">
                <label htmlFor="price_type">Price type</label>

                <select
                  id="price_type"
                  name="price_type"
                  value={formData.price_type}
                  onChange={handleChange}
                >
                  <option value="fixed">Fixed price</option>

                  <option value="negotiable">Negotiable</option>

                  <option value="starting_from">Starting from</option>
                </select>
              </div>
            </div>

            {/* LOCATION */}

            <div className="sh-edit-field">
              <label htmlFor="location">Location</label>

              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="Lagos, Nigeria"
                required
              />
            </div>
          </section>

          {/* IMAGES */}

          <section className="sh-edit-listing-card">
            <div className="sh-edit-listing-card-header">
              <div>
                <span>Listing media</span>

                <h2>Product images</h2>

                <p>
                  Add clear images that help buyers understand your listing.
                </p>
              </div>
            </div>

            <div className="sh-edit-images">
              {/* EXISTING IMAGES */}

              {existingImages.map((image) => (
                <div key={image.id} className="sh-edit-image">
                  <img src={image.image_url} alt="" />

                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.id)}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>

                  {image.sort_order === 0 && <span>Cover</span>}
                </div>
              ))}

              {/* NEW IMAGES */}

              {images.map((image, index) => (
                <div
                  key={`${image.name}-${index}`}
                  className="sh-edit-image sh-edit-new-image"
                >
                  <img src={URL.createObjectURL(image)} alt="" />

                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>

                  <span>New</span>
                </div>
              ))}

              {/* ADD IMAGE */}

              <label className="sh-edit-image-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />

                <ImagePlus size={22} />

                <span>Add images</span>

                <small>JPG, PNG or WEBP</small>
              </label>
            </div>
          </section>

          {/* STATUS */}

          <section className="sh-edit-listing-card sh-edit-status-card">
            <div className="sh-edit-status-icon">
              <Package size={19} />
            </div>

            <div>
              <span>Review status</span>

              <h3>Changes require review</h3>

              <p>
                Updating your listing will send it back for review before it is
                published again.
              </p>
            </div>
          </section>

          {/* MESSAGES */}

          {error && (
            <div className="sh-edit-listing-message sh-edit-listing-error">
              {error}
            </div>
          )}

          {success && (
            <div className="sh-edit-listing-message sh-edit-listing-success">
              {success}
            </div>
          )}

          {/* ACTIONS */}

          <div className="sh-edit-listing-actions">
            <Link to="/dashboard/my-listings" className="sh-edit-cancel">
              Cancel
            </Link>

            <button type="submit" className="sh-edit-save" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle size={16} className="sh-edit-listing-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
