import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { uploadImage } from "../../../api/Utils";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import toast from "react-hot-toast";
import { useState } from "react";

const AddPlant = () => {
  const { user } = useAuth();
  const axiosSecured = useAxiosSecure();
  const [uploadImages, setUploadImages] = useState({
    image: { name: "upload button" },
  });
  console.log(uploadImages);
  const [loading, setLoading] = useState(false);
  const handleAddPlant = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    const name = form.name.value;
    const category = form.category.value;
    const description = form.description.value;
    const price = parseFloat(form.price.value);
    const quantity = parseInt(form.quantity.value);
    const image = form.image.files[0];
    const imageUrl = await uploadImage(image);
    const seller = {
      email: user?.email,
      name: user?.displayName,
      image: user?.photoURL,
    };
    const plantData = {
      name,
      category,
      description,
      price,
      quantity,
      imageUrl,
      seller,
    };
    try {
      await axiosSecured.post("/addPlants", plantData);
      toast.success("Plant has been added");
    } catch (error) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm
        uploadImages={uploadImages}
        handleAddPlant={handleAddPlant}
        setUploadImages={setUploadImages}
        loading={loading}
      />
    </div>
  );
};

export default AddPlant;
