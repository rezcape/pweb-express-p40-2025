import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const createBook = async (req: Request, res: Response) => {
  try {
    const {
      title,
      writer,
      publisher,
      publicationYear,
      description,
      price,
      stockQuantity,
      genreId,
    } = req.body;

    // Validasi input
    if (
      !title ||
      !writer ||
      !publisher ||
      !publicationYear ||
      !price ||
      stockQuantity === undefined ||
      !genreId
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Cek duplikasi title
    const existingBook = await prisma.book.findUnique({
      where: { title },
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: "Book with this title already exists",
      });
    }

    // Cek genre exists
    const genre = await prisma.genre.findFirst({
      where: {
        id: genreId,
        deletedAt: null,
      },
    });

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    const book = await prisma.book.create({
      data: {
        title,
        writer,
        publisher,
        publicationYear: parseInt(publicationYear),
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity),
        genreId,
      },
      include: {
        genre: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    console.error("Create book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      genreId,
      minPrice,
      maxPrice,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { writer: { contains: search as string, mode: "insensitive" } },
        { publisher: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (genreId) {
      where.genreId = genreId as string;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          genre: true,
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.book.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all books error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBookDetail = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.params;

    const book = await prisma.book.findFirst({
      where: {
        id: book_id,
        deletedAt: null,
      },
      include: {
        genre: true,
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Get book detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBooksByGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;
    const { page = "1", limit = "10", search, minPrice, maxPrice } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

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

    // Build filter
    const where: any = {
      genreId: genre_id,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { writer: { contains: search as string, mode: "insensitive" } },
        { publisher: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          genre: true,
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.book.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get books by genre error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.params;
    const {
      title,
      writer,
      publisher,
      publicationYear,
      description,
      price,
      stockQuantity,
      genreId,
    } = req.body;

    // Cek book exists
    const existingBook = await prisma.book.findFirst({
      where: {
        id: book_id,
        deletedAt: null,
      },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Cek duplikasi title (kecuali book sendiri)
    if (title && title !== existingBook.title) {
      const duplicateBook = await prisma.book.findFirst({
        where: {
          title,
          id: { not: book_id },
        },
      });

      if (duplicateBook) {
        return res.status(400).json({
          success: false,
          message: "Book with this title already exists",
        });
      }
    }

    // Cek genre exists jika diupdate
    if (genreId) {
      const genre = await prisma.genre.findFirst({
        where: {
          id: genreId,
          deletedAt: null,
        },
      });

      if (!genre) {
        return res.status(404).json({
          success: false,
          message: "Genre not found",
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (writer) updateData.writer = writer;
    if (publisher) updateData.publisher = publisher;
    if (publicationYear) updateData.publicationYear = parseInt(publicationYear);
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (stockQuantity !== undefined)
      updateData.stockQuantity = parseInt(stockQuantity);
    if (genreId) updateData.genreId = genreId;

    const updatedBook = await prisma.book.update({
      where: { id: book_id },
      data: updateData,
      include: {
        genre: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Update book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.params;

    // Cek book exists
    const book = await prisma.book.findFirst({
      where: {
        id: book_id,
        deletedAt: null,
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Soft delete
    await prisma.book.update({
      where: { id: book_id },
      data: {
        deletedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
