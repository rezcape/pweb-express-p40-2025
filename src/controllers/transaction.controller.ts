import { Request, Response } from "express";
// FIX: Impor Prisma dan tipe-tipe model yang akan kita gunakan
import prisma from "../utils/prisma";
import { Prisma, Book, OrderItem, Order } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";

// --- Helper Types ---
// Tipe ini akan "menangkap" bentuk data dari payload
// yang menyertakan relasi (include)
type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; username: true; email: true } };
    orderItems: { include: { book: true } };
  };
}>;

// Tipe untuk satu item dari payload di atas
type ItemWithBook = OrderWithDetails["orderItems"][0];

// Tipe untuk payload statistik yang lebih kompleks
type OrderWithStatsDetails = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: {
        book: {
          include: {
            genre: true;
          };
        };
      };
    };
  };
}>;

// Tipe untuk satu item dari payload statistik
type ItemWithBookAndGenre = OrderWithStatsDetails["orderItems"][0];

// Tipe untuk input body
interface TransactionItemInput {
  bookId: string;
  quantity: number;
}
// --------------------

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    // FIX: Memberi tipe pada orderItems dari req.body
    const { orderItems }: { orderItems: TransactionItemInput[] } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderItems are required",
      });
    }

    // Validasi semua book exists dan stok cukup
    // FIX: Memberi tipe pada item
    const bookIds = orderItems.map((item: TransactionItemInput) => item.bookId); const books = await prisma.book.findMany({ where: { id: { in: bookIds }, deletedAt: null, }, }); if (books.length !== bookIds.length) { return res.status(404).json({ success: false, message: "One or more books not found", }); }

    // Cek stok dan hitung total
    let totalAmount = 0;
    // FIX: Memberi tipe yang benar untuk data item order
    const orderorderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    // FIX: item akan otomatis bertipe TransactionItemInput
    for (const item of orderItems) {
      // FIX: Memberi tipe 'Book' pada parameter 'b'
      const book = books.find((b: Book) => b.id === item.bookId);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: `Book with id ${item.bookId} not found`,
        });
      }

      if (book.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for book: ${book.title}`,
        });
      }

      totalAmount += book.price * item.quantity;

      orderorderItemsData.push({
        book: {
          connect: { id: item.bookId },
        },

        quantity: item.quantity,
      });
    }

    // Buat transaksi dengan transaction prisma (atomic)
    // FIX: Memberi tipe 'Prisma.TransactionClient' pada 'tx'
    const order: OrderWithDetails = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Buat order
        const newOrder = await tx.order.create({
          data: {
            userId,
            orderItems: {
              create: orderorderItemsData,
            },
          },
          include: {
            orderItems: {
              include: {
                book: true,
              },
            },
            // FIX: Tambahkan include user agar tipenya sesuai dengan OrderWithDetails
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        });

        // Update stok buku
        // FIX: item akan otomatis bertipe TransactionItemInput
        for (const item of orderItems) {
          await tx.book.update({
            where: { id: item.bookId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        return newOrder;
      }
    );

    // Hitung total amount dari order orderItems
    // FIX: Memberi tipe 'number' pada 'sum' dan 'ItemWithBook' pada 'item'
    const calculatedTotal = order.orderItems.reduce(
      (sum: number, item: ItemWithBook) =>
        sum + item.book.price * item.quantity,
      0
    );

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        ...order,
        totalAmount: calculatedTotal,
      },
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              book: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.order.count(),
    ]);

    // Hitung total amount untuk setiap order
    // FIX: Memberi tipe 'OrderWithDetails' pada 'order'
    const ordersWithTotal = (orders as OrderWithDetails[]).map(
      (order: OrderWithDetails) => ({
        ...order,
        // FIX: Memberi tipe 'number' pada 'sum' dan 'ItemWithBook' pada 'item'
        totalAmount: order.orderItems.reduce(
          (sum: number, item: ItemWithBook) =>
            sum + item.book.price * item.quantity,
          0
        ),
      })
    );

    return res.status(200).json({
      success: true,
      data: ordersWithTotal,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTransactionDetail = async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.params;

    // Tipe order akan otomatis menjadi OrderWithDetails | null
    const order = await prisma.order.findUnique({
      where: { id: transaction_id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Hitung total amount
    // FIX: Memberi tipe 'number' pada 'sum' dan 'ItemWithBook' pada 'item'
    const totalAmount = order.orderItems.reduce(
      (sum: number, item: ItemWithBook) =>
        sum + item.book.price * item.quantity,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Get transaction detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTransactionStatistics = async (req: Request, res: Response) => {
  try {
    // Total transaksi
    const totalTransactions = await prisma.order.count();

    // Ambil semua order dengan orderItems
    // Tipe allOrders akan menjadi OrderWithStatsDetails[]
    const allOrders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            book: {
              include: {
                genre: true,
              },
            },
          },
        },
      },
    });

    // Hitung total amount semua transaksi
    let totalAmount = 0;
    // FIX: Buat tipe untuk genreStats agar bisa dipakai di sort
    type GenreStat = { name: string; count: number };
    const genreStats: { [key: string]: GenreStat } = {};

    // FIX: Memberi tipe 'OrderWithStatsDetails' pada 'order'
    (allOrders as OrderWithStatsDetails[]).forEach(
      (order: OrderWithStatsDetails) => {
        // FIX: Memberi tipe 'ItemWithBookAndGenre' pada 'item'
        order.orderItems.forEach((item: ItemWithBookAndGenre) => {
          totalAmount += item.book.price * item.quantity;

          // Hitung per genre
          const genreName = item.book.genre.name;
          if (!genreStats[genreName]) {
            genreStats[genreName] = { name: genreName, count: 0 };
          }
          genreStats[genreName].count += item.quantity;
        });
      }
    );

    // Rata-rata nominal per transaksi
    const averageTransaction =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Genre dengan transaksi paling banyak dan sedikit
    const genreArray: GenreStat[] = Object.values(genreStats);
    // FIX: Memberi tipe 'GenreStat' pada 'a' dan 'b'
    genreArray.sort((a: GenreStat, b: GenreStat) => b.count - a.count);

    const mostPopularGenre = genreArray[0] || null;
    const leastPopularGenre = genreArray[genreArray.length - 1] || null;

    return res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        averageTransactionAmount: Math.round(averageTransaction * 100) / 100,
        mostPopularGenre: mostPopularGenre
          ? {
              name: mostPopularGenre.name,
              totalSold: mostPopularGenre.count,
            }
          : null,
        leastPopularGenre: leastPopularGenre
          ? {
              name: leastPopularGenre.name,
              totalSold: leastPopularGenre.count,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get transaction statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
