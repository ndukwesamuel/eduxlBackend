import bcrypt from "bcrypt";
import User from "../../models/user.js";

export const createAdminUser = async () => {
  try {
    const adminEmail = "main@mail.com";

    const existingAdmin = await User.findOne({ email: adminEmail });

    // await User.deleteOne({ email: adminEmail });
    // console.log("Existing admin user deleted (if any).");
    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash("123456789", 10);

    const adminUser = new User({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,
      isVerified: true,
      roles: ["superadmin"],
    });

    await adminUser.save();
    console.log("Admin user created successfully.");
  } catch (err) {
    console.error("Error creating admin user:", err);
  }
};
