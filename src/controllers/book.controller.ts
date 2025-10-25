import { Request, Response } from "express";
// Sesuaikan path ini ke file prisma config kamu
import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// Create Book
export const createBook = async (req: Request, res: Response) => {
  try {
    // 1. BACA snake_case DARI BODY (sesuai Postman)
    const {
      title,
      writer,
      publisher,
      publication_year,
      description,
      price,
      stock_quantity,
      genre_id,
    } = req.body;

    // 2. VALIDASI snake_case
    if (
      !title ||
      !writer ||
      !publisher ||
      !publication_year ||
      price === undefined ||
      stock_quantity === undefined ||
      !genre_id
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // 3. Cek duplikasi title (yang belum di-soft-delete)
    const existingBook = await prisma.book.findFirst({
      where: {
        title,
        deletedAt: null, // Hanya cek buku yang aktif
      },
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: "Book with this title already exists",
      });
    }

    // 4. Cek genre exists (yang belum di-soft-delete)
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

    // 5. MAPPING ke camelCase SAAT CREATE
    const newBook = await prisma.book.create({
      data: {
        title,
        writer,
        publisher,
        publicationYear: parseInt(publication_year), // Mapping
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stock_quantity), // Mapping
        genreId: genre_id, // Mapping
      },
      select: {
        // Sesuai respons Postman
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: newBook,
    });
  } catch (error) {
    console.error("Create book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Books (dengan Filter & Pagination Postman)
export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      orderByTitle = "",
      orderByPublishDate = "",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: Prisma.BookWhereInput = {
      deletedAt: null, // Filter soft delete
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { writer: { contains: search as string, mode: "insensitive" } },
        { publisher: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Build sorting
    const orderBy: Prisma.BookOrderByWithRelationInput[] = [];
    if (orderByTitle === "asc" || orderByTitle === "desc") {
      orderBy.push({ title: orderByTitle });
    }
    if (orderByPublishDate === "asc" || orderByPublishDate === "desc") {
      orderBy.push({ publicationYear: orderByPublishDate });
    }
    if (orderBy.length === 0) {
      orderBy.push({ createdAt: "desc" }); // Default sort
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          genre: {
            select: { name: true }, // Ambil nama genre
          },
        },
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.book.count({ where }),
    ]);

    // Format data agar 'genre' jadi string (sesuai Postman)
    const formattedBooks = books.map((book) => ({
      id: book.id,
      title: book.title,
      writer: book.writer,
      publisher: book.publisher,
      publication_year: book.publicationYear,
      description: book.description,
      price: book.price,
      stock_quantity: book.stockQuantity,
      genre: book.genre.name, // Ubah objek genre jadi string nama
    }));

    return res.status(200).json({
      success: true,
      message: "Get all book successfully",
      data: formattedBooks,
      meta: {
        // Ganti 'pagination' jadi 'meta' sesuai Postman
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

// Get Book by ID
export const getBookById = async (req: Request, res: Response) => {
  try {
    // 1. BACA 'id' DARI req.params (BUKAN 'book_id')
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: {
        id: id, // <-- GUNAKAN 'id'
        deletedAt: null,
      },
      include: {
        genre: {
          select: { name: true },
        },
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Format data agar 'genre' jadi string (sesuai Postman)
    const formattedBook = {
      id: book.id,
      title: book.title,
      writer: book.writer,
      publisher: book.publisher,
      publication_year: book.publicationYear,
      description: book.description,
      price: book.price,
      stock_quantity: book.stockQuantity,
      genre: book.genre.name, // Ubah objek genre jadi string nama
    };

    return res.status(200).json({
      success: true,
      message: "Get book detail successfully",
      data: formattedBook,
    });
  } catch (error) {
    console.error("Get book detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Books by Genre
export const getBooksByGenre = async (req: Request, res: Response) => {
  try {
    // 1. BACA 'genreId' DARI req.params (BUKAN 'genre_id')
    const { genreId } = req.params;

    // Ambil filter pagination (ini sudah benar di kodemu)
    const { page = "1", limit = "10", search, minPrice, maxPrice } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Cek genre exists
    const genre = await prisma.genre.findFirst({
      where: {
        id: genreId, // <-- GUNAKAN 'genreId'
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
    const where: Prisma.BookWhereInput = {
      genreId: genreId, // <-- GUNAKAN 'genreId'
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
          genre: {
            select: { name: true },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.book.count({ where }),
    ]);

    // Format data agar 'genre' jadi string (sesuai Postman)
    const formattedBooks = books.map((book) => ({
      id: book.id,
      title: book.title,
      writer: book.writer,
      publisher: book.publisher,
      publication_year: book.publicationYear,
      description: book.description,
      price: book.price,
      stock_quantity: book.stockQuantity,
      genre: book.genre.name,
    }));

    return res.status(200).json({
      success: true,
      message: "Get all book by genre successfully",
      data: formattedBooks,
      meta: {
        // Ganti 'pagination' jadi 'meta' sesuai Postman
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

// Update Book (PATCH)
export const updateBook = async (req: Request, res: Response) => {
  try {
    // 1. BACA 'id' DARI req.params (BUKAN 'book_id')
    const { id } = req.params;

    // 2. BACA snake_case DARI BODY
    const { description, price, stock_quantity } = req.body;

    // Cek book exists
    const existingBook = await prisma.book.findFirst({
      where: {
        id: id, // <-- GUNAKAN 'id'
        deletedAt: null,
      },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // 3. Postman hanya minta 3 field ini yang bisa di-update
    // Build update data
    const updateData: Prisma.BookUpdateInput = {};
    if (description !== undefined) {
      updateData.description = description;
    }
    if (price !== undefined) {
      updateData.price = parseFloat(price);
    }
    if (stock_quantity !== undefined) {
      // MAPPING snake_case ke camelCase
      updateData.stockQuantity = parseInt(stock_quantity);
    }

    // Cek jika tidak ada data valid yang dikirim
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedBook = await prisma.book.update({
      where: { id: id }, // <-- GUNAKAN 'id'
      data: updateData,
      select: {
        // Sesuai respons Postman
        id: true,
        title: true,
        updatedAt: true,
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

// Delete Book (Soft Delete)
export const deleteBook = async (req: Request, res: Response) => {
  try {
    // 1. BACA 'id' DARI req.params (BUKAN 'book_id')
    const { id } = req.params;

    // Cek book exists
    const book = await prisma.book.findFirst({
      where: {
        id: id, // <-- GUNAKAN 'id'
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
      where: { id: id }, // <-- GUNAKAN 'id'
      data: {
        deletedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book removed successfully", // Sesuai Postman
    });
  } catch (error) {
    console.error("Delete book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
