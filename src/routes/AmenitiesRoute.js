import express from "express";

import { isAdmin, requireSignin } from "../middlewares/auth.js";
import {
  checkClanAdmin,
  checkClan_IsApproved_and_MemberApproved_Admin,
  checkClan_IsAproved_and_MemberAproved,
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  check_User_is_Admins_of_clan,
} from "../middlewares/clan.js";

import Clan from "../models/clan.js";
import {
  ClanAdmin_Get_All_EmergencyReport,
  ClanAdmin_Get_Single_EmergencyReport,
  ClanAdmin_resolve_EmergencyReport,
  CreateEmergencyReport,
} from "../controllers/emergencyreport.js";
import {
  AdminGetAllAmenties,
  CreateAmenties,
  DeleteAmenties,
} from "../controllers/AmenitiesCon.js";

const router = express.Router();

router
  .route("/")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    AdminGetAllAmenties
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    CreateAmenties
  );

router
  .route("/all")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    AdminGetAllAmenties
  );

router
  .route("/:amenitiesId")
  .delete(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    DeleteAmenties
  );

// Get all amenities
// router.get(
//   "/",
//   requireSignin,
//   checkClan_IsAproved_and_UserAnAdmin_noParams,
//   async (req, res) => {
//     try {
//       const clan_id = req.clan;
//       // const amenities = await Amenities.find().populate("clan");
//       res.status(200).json({ amenities: clan_id });
//     } catch (error) {
//       res.status(500).json({ message: "Error fetching amenities", error });
//     }
//   }
// );

// // Create a new amenity
// router.post("/amenities", async (req, res) => {
//   try {
//     const { name, payment, clan } = req.body;
//     const newAmenity = new Amenities({ name, payment, clan });
//     await newAmenity.save();
//     res.status(201).json(newAmenity);
//   } catch (error) {
//     res.status(500).json({ message: "Error creating amenity", error });
//   }
// });

// // Delete an amenity by ID
// router.delete("/amenities/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedAmenity = await Amenities.findByIdAndDelete(id);
//     if (!deletedAmenity) {
//       return res.status(404).json({ message: "Amenity not found" });
//     }
//     res.status(200).json({ message: "Amenity deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting amenity", error });
//   }
// });

export default router;
