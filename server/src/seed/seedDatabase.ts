import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Admin } from "../models/Admin";
import { Attraction } from "../models/Attraction";
import { Category } from "../models/Category";
import { Photo } from "../models/Photo";
import { GuideCard } from "../models/GuideCard";
import { Message } from "../models/Message";
import { Story } from "../models/Story";
import { Trip } from "../models/Trip";
import { attractionSeed, categorySeed } from "./catalog";
import { guideSeed, storySeed, tripSeed } from "./content";
import { moreAttractions } from "./morePlaces";
import { otherAttractions, otherGuides, otherStories, otherTrips } from "./oblasts";

function oblastOf(item: object) {
  const value = (item as { oblast?: string }).oblast;
  return value || "gomel";
}

function photoAlt(item: object) {
  const row = item as { title?: string; photoAlt?: string };
  return row.photoAlt || row.title || "";
}

export async function seedDatabase() {
  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  await Admin.deleteMany({ login: { $ne: env.adminLogin } });
  await Admin.findOneAndUpdate(
    { login: env.adminLogin },
    { login: env.adminLogin, passwordHash },
    { upsert: true }
  );

  for (const item of categorySeed) {
    await Category.findOneAndUpdate({ slug: item.slug }, item, { upsert: true });
  }

  const categories = await Category.find();
  const bySlug = new Map(categories.map((item) => [item.slug, item._id]));

  await Attraction.updateMany(
    { $or: [{ oblast: { $exists: false } }, { oblast: null }, { oblast: "" }] },
    { $set: { oblast: "gomel" } }
  );
  await Story.updateMany(
    { $or: [{ oblast: { $exists: false } }, { oblast: null }, { oblast: "" }] },
    { $set: { oblast: "gomel" } }
  );
  await Trip.updateMany(
    { $or: [{ oblast: { $exists: false } }, { oblast: null }, { oblast: "" }] },
    { $set: { oblast: "gomel" } }
  );
  await GuideCard.updateMany(
    { $or: [{ oblast: { $exists: false } }, { oblast: null }, { oblast: "" }] },
    { $set: { oblast: "gomel" } }
  );
  await Message.updateMany(
    { $or: [{ oblast: { $exists: false } }, { oblast: null }, { oblast: "" }] },
    { $set: { oblast: "gomel" } }
  );

  for (const item of [...attractionSeed, ...otherAttractions, ...moreAttractions]) {
    const categoryId = bySlug.get(item.categorySlug);
    if (!categoryId) {
      continue;
    }
    const existing = await Attraction.findOne({ slug: item.slug });
    if (existing) {
      existing.history = item.history;
      existing.description = item.description;
      existing.district = item.district;
      existing.oblast = oblastOf(item);
      existing.location = { type: "Point", coordinates: [item.lng, item.lat] };
      existing.markModified("location");
      await existing.save();
      const photos = await Photo.find({ attraction: existing._id });
      if (photos.length === 0) {
        await Photo.create({
          attraction: existing._id,
          url: item.photo,
          alt: photoAlt(item),
        });
      } else if (photos[0].url !== item.photo) {
        photos[0].url = item.photo;
        photos[0].alt = photoAlt(item);
        await photos[0].save();
      }
      continue;
    }
    const attraction = await Attraction.create({
      title: item.title,
      slug: item.slug,
      description: item.description,
      history: item.history,
      district: item.district,
      address: item.address,
      place: item.place,
      category: categoryId,
      location: { type: "Point", coordinates: [item.lng, item.lat] },
      rating: item.rating,
      workHours: item.workHours,
      oblast: oblastOf(item),
    });
    await Photo.create({
      attraction: attraction._id,
      url: item.photo,
      alt: photoAlt(item),
    });
  }

  for (const item of [...storySeed, ...otherStories]) {
    const existing = await Story.findOne({ slug: item.slug });
    if (!existing) {
      await Story.create({ ...item, oblast: oblastOf(item) });
      continue;
    }
    existing.era = item.era;
    existing.title = item.title;
    existing.lead = item.lead;
    existing.body = item.body;
    existing.oblast = oblastOf(item);
    await existing.save();
  }
  for (const item of [...guideSeed, ...otherGuides]) {
    const existing = await GuideCard.findOne({ slug: item.slug });
    if (!existing) {
      await GuideCard.create({ ...item, oblast: oblastOf(item) });
      continue;
    }
    existing.title = item.title;
    existing.text = item.text;
    existing.oblast = oblastOf(item);
    await existing.save();
  }
  for (const item of [...tripSeed, ...otherTrips]) {
    const existing = await Trip.findOne({ slug: item.slug });
    if (!existing) {
      await Trip.create({ ...item, oblast: oblastOf(item) });
      continue;
    }
    existing.title = item.title;
    existing.lead = item.lead;
    existing.cafeTitle = item.cafeTitle;
    existing.cafeNote = item.cafeNote;
    existing.oblast = oblastOf(item);
    await existing.save();
  }
}
