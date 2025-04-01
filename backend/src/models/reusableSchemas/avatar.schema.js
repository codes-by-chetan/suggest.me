const avatarSchema = {
    publicId: {
        type: String,
        required: [true, "publicId is required"],
    },
    url: {
        type: String,
        required: [true, "URL is required"],
    },
};

export default avatarSchema;
