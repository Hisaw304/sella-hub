import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  ImagePlus,
  Laptop,
  MapPin,
  Package,
  Phone,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const CreateListing = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    listingType: "product",
    title: "",
    categoryId: "",
    description: "",
    price: "",
    priceType: "fixed",
    location: "",
    phone: "",
  });

  /*
  ========================================
  LOAD USER
  ========================================
  */

  useEffect(() => {
    const loadData = async () => {
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
        GET ACTIVE PLAN
        ========================================
        */

        const { data: planData, error: planError } = await supabase
          .from("user_plans")
          .select(
            `
            *,
            pricing_plans (
              id,
              name,
              max_listings,
              max_images
            )
          `
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (planError) {
          throw planError;
        }

        setUserPlan(planData);

        /*
        ========================================
        GET CATEGORIES
        ========================================
        */

        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true,
          });

        if (categoryError) {
          throw categoryError;
        }

        setCategories(categoryData || []);
      } catch (err) {
        console.error("Create listing load error:", err);
        setError("Unable to load the listing form.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  /*
  ========================================
  FORM CHANGE
  ========================================
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  ========================================
  IMAGE UPLOAD
  ========================================
  */

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (!userPlan?.pricing_plans) {
      setError("You need an active plan before uploading images.");
      return;
    }

    const maxImages = userPlan.pricing_plans.max_images;

    if (images.length + files.length > maxImages) {
      setError(
        `Your ${userPlan.pricing_plans.name} plan allows up to ${maxImages} images.`
      );

      event.target.value = "";
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB.`);
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setImages((previous) => [...previous, ...validFiles]);

    setError("");
    event.target.value = "";
  };

  /*
  ========================================
  REMOVE IMAGE
  ========================================
  */

  const removeImage = (index) => {
    setImages((previous) => {
      const imageToRemove = previous[index];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return previous.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  /*
  ========================================
  MOVE IMAGE
  ========================================
  */

  const moveImage = (index, direction) => {
    setImages((previous) => {
      const newImages = [...previous];

      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newImages.length) {
        return previous;
      }

      [newImages[index], newImages[targetIndex]] = [
        newImages[targetIndex],
        newImages[index],
      ];

      return newImages;
    });
  };

  /*
  ========================================
  CREATE SLUG
  ========================================
  */

  const createSlug = (title) => {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    return `${baseSlug}-${Date.now()}`;
  };

  /*
  ========================================
  SUBMIT
  ========================================
  */

  const handleSubmit = async (event, status = "pending") => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    if (!userPlan) {
      setError("You need an active pricing plan before creating a listing.");
      return;
    }

    const remainingListings =
      userPlan.listings_allowed - userPlan.listings_used;

    if (remainingListings <= 0) {
      setError(
        "You have used all the listings available on your current plan."
      );
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a listing title.");
      return;
    }

    if (!formData.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (formData.priceType !== "contact" && !formData.price) {
      setError("Please enter a price.");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one listing image.");
      return;
    }

    try {
      setSubmitting(true);

      /*
      ========================================
      CREATE LISTING
      ========================================
      */

      const price =
        formData.priceType === "contact" ? null : Number(formData.price);

      const slug = createSlug(formData.title);

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          category_id: formData.categoryId,
          title: formData.title.trim(),
          slug,
          listing_type: formData.listingType,
          description: formData.description.trim(),
          price,
          price_type: formData.priceType,
          location: formData.location.trim(),
          phone: formData.phone.trim(),
          status,
        })
        .select()
        .single();

      if (listingError) {
        throw listingError;
      }

      /*
      ========================================
      UPLOAD IMAGES
      ========================================
      */

      const imageRecords = [];

      for (let index = 0; index < images.length; index++) {
        const image = images[index];

        const fileExtension = image.file.name.split(".").pop();

        const fileName = `${Date.now()}-${index}.${fileExtension}`;

        const storagePath = `${user.id}/${listing.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(storagePath, image.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("listing-images").getPublicUrl(storagePath);

        imageRecords.push({
          listing_id: listing.id,
          storage_path: storagePath,
          image_url: publicUrl,
          sort_order: index,
        });
      }

      /*
      ========================================
      SAVE IMAGE RECORDS
      ========================================
      */

      const { error: imageError } = await supabase
        .from("listing_images")
        .insert(imageRecords);

      if (imageError) {
        throw imageError;
      }

      /*
      ========================================
      UPDATE LISTING USAGE
      ========================================
      */

      const { error: planUpdateError } = await supabase
        .from("user_plans")
        .update({
          listings_used: userPlan.listings_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userPlan.id)
        .eq("user_id", user.id);

      if (planUpdateError) {
        throw planUpdateError;
      }

      setSuccess(
        status === "draft"
          ? "Your listing has been saved as a draft."
          : "Your listing has been submitted successfully."
      );

      setTimeout(() => {
        navigate("/dashboard/my-listings");
      }, 1200);
    } catch (err) {
      console.error("Create listing error:", err);

      setError(
        err.message || "Something went wrong while creating your listing."
      );
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
      <main className="sh-create-listing-page">
        <div className="sh-create-listing-loading">Loading listing form...</div>
      </main>
    );
  }

  const remainingListings = userPlan
    ? userPlan.listings_allowed - userPlan.listings_used
    : 0;

  const maxImages = userPlan?.pricing_plans?.max_images || 0;

  return (
    <main className="sh-create-listing-page">
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="sh-create-listing-container">
        <div className="sh-create-listing-topbar">
          <Link to="/dashboard" className="sh-create-listing-back">
            <ArrowLeft size={17} />
            Dashboard
          </Link>

          <div className="sh-create-listing-heading">
            <span>Create listing</span>

            <h1>
              Publish your
              <strong> listing.</strong>
            </h1>

            <p>
              Add your product or service and make it discoverable on SellaHub.
            </p>
          </div>
        </div>

        {/* ========================================
            PLAN NOTICE
        ======================================== */}

        <div className="sh-create-listing-plan">
          <div className="sh-create-listing-plan-icon">
            <Check size={18} />
          </div>

          <div>
            <span>Current plan</span>

            <strong>{userPlan?.pricing_plans?.name || "No active plan"}</strong>
          </div>

          <div className="sh-create-listing-plan-stat">
            <span>Listings remaining</span>

            <strong>{remainingListings}</strong>
          </div>

          <div className="sh-create-listing-plan-stat">
            <span>Image limit</span>

            <strong>{maxImages}</strong>
          </div>
        </div>

        {/* ========================================
            ERROR / SUCCESS
        ======================================== */}

        {error && (
          <div className="sh-create-listing-alert sh-create-listing-alert-error">
            <X size={17} />
            {error}
          </div>
        )}

        {success && (
          <div className="sh-create-listing-alert sh-create-listing-alert-success">
            <Check size={17} />
            {success}
          </div>
        )}

        {/* ========================================
            FORM
        ======================================== */}

        <form className="sh-create-listing-form" onSubmit={handleSubmit}>
          {/* ========================================
              BASIC INFORMATION
          ======================================== */}

          <section className="sh-create-listing-card">
            <div className="sh-create-listing-card-header">
              <div>
                <span>01</span>

                <h2>Basic information</h2>

                <p>Tell buyers what you are offering.</p>
              </div>
            </div>

            {/* LISTING TYPE */}

            <div className="sh-create-listing-field">
              <label>What are you listing?</label>

              <div className="sh-create-listing-type">
                <button
                  type="button"
                  className={formData.listingType === "product" ? "active" : ""}
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      listingType: "product",
                    }))
                  }
                >
                  <Package size={19} />

                  <span>
                    <strong>Product</strong>
                    Physical goods or products
                  </span>
                </button>

                <button
                  type="button"
                  className={formData.listingType === "service" ? "active" : ""}
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      listingType: "service",
                    }))
                  }
                >
                  <Briefcase size={19} />

                  <span>
                    <strong>Service</strong>
                    Professional or local services
                  </span>
                </button>
              </div>
            </div>

            {/* TITLE */}

            <div className="sh-create-listing-field">
              <label htmlFor="title">Listing title</label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Premium Leather Office Chair"
                maxLength={100}
                required
              />
            </div>

            {/* CATEGORY */}

            <div className="sh-create-listing-field">
              <label htmlFor="categoryId">Category</label>

              <div className="sh-create-listing-select">
                <Tag size={17} />

                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
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
            </div>

            {/* DESCRIPTION */}

            <div className="sh-create-listing-field">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product or service..."
                rows={7}
                maxLength={5000}
                required
              />

              <small>{formData.description.length}/5000</small>
            </div>
          </section>

          {/* ========================================
              PRICE & LOCATION
          ======================================== */}

          <section className="sh-create-listing-card">
            <div className="sh-create-listing-card-header">
              <div>
                <span>02</span>

                <h2>Price & location</h2>

                <p>Give buyers useful information about your offer.</p>
              </div>
            </div>

            <div className="sh-create-listing-grid">
              {/* PRICE */}

              <div className="sh-create-listing-field">
                <label htmlFor="price">Price</label>

                <div className="sh-create-listing-price-input">
                  <span>₦</span>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={formData.priceType === "contact"}
                  />
                </div>
              </div>

              {/* PRICE TYPE */}

              <div className="sh-create-listing-field">
                <label htmlFor="priceType">Price type</label>

                <select
                  id="priceType"
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleChange}
                >
                  <option value="fixed">Fixed price</option>

                  <option value="starting_from">Starting from</option>

                  <option value="negotiable">Negotiable</option>

                  <option value="contact">Contact seller</option>
                </select>
              </div>
            </div>

            {/* LOCATION */}

            <div className="sh-create-listing-field">
              <label htmlFor="location">Location</label>

              <div className="sh-create-listing-input-icon">
                <MapPin size={17} />

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Ikeja, Lagos"
                />
              </div>
            </div>

            {/* PHONE */}

            <div className="sh-create-listing-field">
              <label htmlFor="phone">Contact phone</label>

              <div className="sh-create-listing-input-icon">
                <Phone size={17} />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </section>

          {/* ========================================
              IMAGES
          ======================================== */}

          <section className="sh-create-listing-card">
            <div className="sh-create-listing-card-header">
              <div>
                <span>03</span>

                <h2>Listing images</h2>

                <p>
                  Add clear images that show buyers exactly what you are
                  offering.
                </p>
              </div>

              <div className="sh-create-listing-image-count">
                {images.length}/{maxImages}
              </div>
            </div>

            <div className="sh-create-listing-upload">
              <input
                id="listingImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={images.length >= maxImages}
              />

              <label htmlFor="listingImages">
                <div className="sh-create-listing-upload-icon">
                  <ImagePlus size={22} />
                </div>

                <strong>Add listing images</strong>

                <span>PNG, JPG or WEBP · Maximum 5MB each</span>

                <small>Up to {maxImages} images on your plan</small>
              </label>
            </div>

            {images.length > 0 && (
              <div className="sh-create-listing-images">
                {images.map((image, index) => (
                  <div
                    className="sh-create-listing-image"
                    key={`${image.file.name}-${index}`}
                  >
                    <img
                      src={image.preview}
                      alt={`Listing preview ${index + 1}`}
                    />

                    {index === 0 && (
                      <span className="sh-primary-image">Main image</span>
                    )}

                    <div className="sh-create-listing-image-actions">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, "left")}
                          aria-label="Move image left"
                        >
                          ←
                        </button>
                      )}

                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, "right")}
                          aria-label="Move image right"
                        >
                          →
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========================================
              SUBMIT
          ======================================== */}

          <div className="sh-create-listing-actions">
            <button
              type="button"
              className="sh-create-listing-draft"
              onClick={(event) => handleSubmit(event, "draft")}
              disabled={submitting}
            >
              Save draft
            </button>

            <button
              type="submit"
              className="sh-create-listing-submit"
              disabled={submitting || remainingListings <= 0}
            >
              {submitting ? "Publishing..." : "Submit listing"}

              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreateListing;
