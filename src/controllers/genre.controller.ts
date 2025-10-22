import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const createGenre = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Genre name is required",
      });
    }

    // Cek duplikasi
    const existingGenre = await prisma.genre.findUnique({
      where: { name },
    });

    if (existingGenre) {
      return res.status(400).json({
        success: false,
        message: "Genre already exists",
      });
    }

    const genre = await prisma.genre.create({
      data: { name },
    });

    return res.status(201).json({
      success: true,
      message: "Genre created successfully",
      data: genre,
    });
  } catch (error) {
    console.error("Create genre error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllGenres = async (req: Request, res: Response) => {
  try {
    const genres = await prisma.genre.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: genres,
    });
  } catch (error) {
    console.error("Get all genres error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getGenreDetail = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;

    const genre = await prisma.genre.findFirst({
      where: {
        id: genre_id,
        deletedAt: null,
      },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: genre,
    });
  } catch (error) {
    console.error("Get genre detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;
    const { name } = req.body;

    // Cek genre exists
    const existingGenre = await prisma.genre.findFirst({
      where: {
        id: genre_id,
        deletedAt: null,
      },
    });

    if (!existingGenre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    // Cek duplikasi nama (kecuali genre sendiri)
    if (name) {
      const duplicateGenre = await prisma.genre.findFirst({
        where: {
          name,
          id: { not: genre_id },
        },
      });

      if (duplicateGenre) {
        return res.status(400).json({
          success: false,
          message: "Genre name already exists",
        });
      }
    }

    const updatedGenre = await prisma.genre.update({
      where: { id: genre_id },
      data: { name },
    });

    return res.status(200).json({
      success: true,
      message: "Genre updated successfully",
      data: updatedGenre,
    });
  } catch (error) {
    console.error("Update genre error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;

    // Cek genre exists
    const genre = await prisma.genre.findFirst({
      where: {
        id: genre_id,
        deletedAt: null,
      },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    // Soft delete (set deletedAt)
    await prisma.genre.update({
      where: { id: genre_id },
      data: {
        deletedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Genre deleted successfully",
    });
  } catch (error) {
    console.error("Delete genre error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
