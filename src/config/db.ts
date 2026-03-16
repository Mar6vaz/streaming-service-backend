import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri: string = process.env.MONGODB_URI as string;

  try {
    await mongoose.connect(uri);
    console.log("Conectado a Mongo Atlas!");
  } catch (error) {
    console.error("Error al conectar Mongo Atlas:", error);
    process.exit(1);
  }
};