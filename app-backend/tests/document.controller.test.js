import {
  addDocument,
  getDocuments,
  getSingleDocument,
  updateDocument,
} from '../src/controllers/document.controller.js';

import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocumentExpiry,
} from '../src/services/document.service.js';

jest.mock('../src/services/document.service.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { _id: 'user123', role: 'admin' },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

describe('Document Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  // ADD DOCUMENT
  // ------------------------
  test('should create document successfully', async () => {
    const mockResult = { id: 'doc1', name: 'License' };

    createDocument.mockResolvedValue(mockResult);

    const req = mockReq({
      body: { name: 'License' },
    });

    const res = mockRes();

    await addDocument(req, res);

    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'License',
        userId: 'user123',
      }),
      req.user
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should return 400 on create error', async () => {
    createDocument.mockRejectedValue(new Error('Create failed'));

    const req = mockReq();
    const res = mockRes();

    await addDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ------------------------
  // GET ALL DOCUMENTS
  // ------------------------
  test('should get all documents', async () => {
    const mockData = [{ id: 1 }, { id: 2 }];

    getAllDocuments.mockResolvedValue(mockData);

    const req = mockReq({
      query: { type: 'license' },
    });

    const res = mockRes();

    await getDocuments(req, res);

    expect(getAllDocuments).toHaveBeenCalledWith({ type: 'license' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  test('should return 400 if service fails', async () => {
    getAllDocuments.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ------------------------
  // GET SINGLE DOCUMENT
  // ------------------------
  test('should get document by id', async () => {
    const mockDoc = { id: 'doc123' };

    getDocumentById.mockResolvedValue(mockDoc);

    const req = mockReq({
      params: { id: 'doc123' },
    });

    const res = mockRes();

    await getSingleDocument(req, res);

    expect(getDocumentById).toHaveBeenCalledWith('doc123');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockDoc);
  });

  test('should return 404 if document not found', async () => {
    getDocumentById.mockRejectedValue(new Error('Not found'));

    const req = mockReq({
      params: { id: 'doc123' },
    });

    const res = mockRes();

    await getSingleDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // ------------------------
  // UPDATE DOCUMENT
  // ------------------------
  test('should update document expiry successfully', async () => {
    const mockResult = { id: 'doc1', expiryDate: '2026-01-01' };

    updateDocumentExpiry.mockResolvedValue(mockResult);

    const req = mockReq({
      params: { id: 'doc1' },
      body: { expiryDate: '2026-01-01' },
    });

    const res = mockRes();

    await updateDocument(req, res);

    expect(updateDocumentExpiry).toHaveBeenCalledWith(
      'doc1',
      '2026-01-01',
      req.user
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should return 400 on update failure', async () => {
    updateDocumentExpiry.mockRejectedValue(new Error('Update failed'));

    const req = mockReq({
      params: { id: 'doc1' },
      body: { expiryDate: '2026-01-01' },
    });

    const res = mockRes();

    await updateDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});