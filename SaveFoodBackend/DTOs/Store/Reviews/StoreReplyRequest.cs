using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store.Reviews
{
    public class StoreReplyRequest
    {
        [Required]
        [MaxLength(1000)]
        public string ReplyText { get; set; } = null!;
    }
}
