import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await axios.post("https://ritiks-insight-hub-nameverse.onrender.com/api/contact/submit", data);
      toast.success("✅ Message sent successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      reset();
    } catch (err) {
      toast.error("❌ Failed to send message.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="container mt-5 pt-5">
      <ToastContainer />
      <h2>Contact Me</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name */}
        <input
          className="form-control mb-1"
          placeholder="Name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-danger small">{errors.name.message}</p>
        )}

        {/* Email */}
        <input
          className="form-control mb-1"
          placeholder="Email"
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
          })}
        />
        {errors.email && (
          <p className="text-danger small">{errors.email.message}</p>
        )}

        {/* Phone Number */}
        <input
          className="form-control mb-1"
          placeholder="Phone Number"
          {...register("phone", {
            required: "Phone number is required",
            pattern: {
              value: /^[0-9]{10}$/,
              message: "Phone number must be 10 digits",
            },
          })}
        />
        {errors.phone && (
          <p className="text-danger small">{errors.phone.message}</p>
        )}
        {/* Message */}
        <textarea
          className="form-control mb-1"
          placeholder="Message"
          {...register("message", {
            required: "Message is required",
            minLength: {
              value: 10,
              message: "Message must be at least 10 characters",
            },
          })}
        ></textarea>
        {errors.message && (
          <p className="text-danger small">{errors.message.message}</p>
        )}

        {/* Submit Button */}
        <button type="submit" className="btn btn-success">
          Send
        </button>
      </form>
    </div>
  );
}
