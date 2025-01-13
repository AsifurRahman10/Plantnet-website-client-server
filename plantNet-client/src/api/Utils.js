import axios from "axios";

// upload image to cloud
export const uploadImage = async (image) => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "test_01");
    // 1.upload the image to
    const { data: photo } = await axios.post(
        "https://api.cloudinary.com/v1_1/dsa8ooidh/image/upload",
        formData
    );
    return photo.url;
}