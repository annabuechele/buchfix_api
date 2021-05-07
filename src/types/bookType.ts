type BookType = {
  isbn: string;
  title: string;
  sites: number;
  fk_format?: number;
  fk_genre?: number;
  fk_file?: number;
  genre: string;
  format: string;
  path: string;
  file_name?: string;
};

export default BookType;
