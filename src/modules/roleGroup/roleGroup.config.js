

const methodsDataList= (resource)=>[
    { _id: resource.id, name: "view", allow: false },
    { _id: resource.id, name: "add_more_process", allow: false },
    { _id: resource.id, name: "set_complete", allow: false },
    { _id: resource.id, name: "department_incharge", allow: false },
    { _id: resource.id, name: "set_feedback", allow: false },
    { _id: resource.id, name: "set_command", allow: false },
    { _id: resource.id, name: "returnDocs", allow: false },
    { _id: resource.id, name: "force_set_complete", allow: false }
]
const permissionMap = {
    "xem": "view",
    "nhanvbcuaphong": "department_incharge",
    "tralai": "returnDocs",
    "batbuochoanthanh": "force_set_complete",
    "giaochidao": "set_command",
    "xinykien": "set_feedback",
    "hoanthanhxuly": "set_complete",
    "themxuly": "add_more_process",
    "chuyenxulybatky": "free_role_to_set"
};
const columnsDataDetails = [
    {
        "_id": "663d9459a010b93bde437e56",
        "name": "view",
        "title": "Xem"
    },
    {
        "_id": "663d9459a010b93bde437e55",
        "name": "set_command",
        "title": "Giao chỉ đạo"
    },
    {
        "_id": "663d9459a010b93bde437e54",
        "name": "free_role_to_set",
        "title": "Chuyển xử lý bất kỳ"
    },
    {
        "_id": "663d9459a010b93bde437e53",
        "name": "department_incharge",
        "title": "Nhận VB của phòng"
    },
    {
        "_id": "663d9459a010b93bde437e52",
        "name": "set_complete",
        "title": "Hoàn thành xử lý"
    },
    {
        "_id": "663d9459a010b93bde437e51",
        "name": "returnDocs",
        "title": "Trả lại"
    },
    {
        "_id": "663d9459a010b93bde437e50",
        "name": "add_more_process",
        "title": "Thêm xử lý"
    },
    {
        "_id": "663d9459a010b93bde437e4f",
        "name": "force_set_complete",
        "title": "Bắt buộc hoàn thành"
    },
    {
        "_id": "663d9459a010b93bde437e4e",
        "name": "set_feedback",
        "title": "Xin ý kiến"
    },
    {
        "_id": "663d9459a010b93bde437e4d",
        "name": "recallDocs",
        "title": "Thu hồi"
    },
    {
        "_id": "663d9459a010b93bde437e4c",
        "name": "deadlineIncrease",
        "title": "Gia hạn xử lý"
    },
    
]
const combinedPermissions = Object.entries(permissionMap).map(([key, value]) => {
    return {
        _id: key,
        name: value,
        title: key // Trả về null nếu không tìm thấy
    };
});
const rowDataDetails = [
    {
        "_id": "663d9459a010b93bde437e5d",
        "name": "receive",
        "title": "Tiếp nhận"
    },
    {
        "_id": "663d9459a010b93bde437e5c",
        "name": "processing",
        "title": "Xử lý"
    },
    {
        "_id": "663d9459a010b93bde437e5b",
        "name": "support",
        "title": "Phối hợp"
    },
    {
        "_id": "663d9459a010b93bde437e5a",
        "name": "view",
        "title": "Nhận để biết"
    },
    {
        "_id": "663d9459a010b93bde437e59",
        "name": "command",
        "title": "Chỉ đạo"
    },
    {
        "_id": "663d9459a010b93bde437e58",
        "name": "feedback",
        "title": "Ý kiến"
    },
    {
        "_id": "663d9459a010b93bde437e57",
        "name": "findStatistics",
        "title": "Tra cứu/Thống kê"
    }
]
const setData = {
    view: false,
    set_command: false,
    free_role_to_set: false,
    department_incharge: false,
    set_complete: false,
    returnDocs: false,
    add_more_process: false,
    force_set_complete: false,
    set_feedback: false
}
 module.exports ={
    permissionMap,
    setData,
    methodsDataList,
    rowDataDetails,
    columnsDataDetails,
    combinedPermissions
 }

