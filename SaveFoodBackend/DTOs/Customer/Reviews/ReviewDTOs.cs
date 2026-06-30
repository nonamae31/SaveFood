using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Customer.Reviews
{
    public class ReviewRequest
    {
        [Required]
        [Range(1, 5)]
        public byte Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public List<IFormFile>? Images { get; set; }
    }

    public class ReviewResponse
    {
        public Guid Id { get; set; }
        public Guid OrderItemId { get; set; }
        public byte Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? StoreReply { get; set; }
        public DateTime? StoreReplyAt { get; set; }
        
        public List<string> Images { get; set; } = new List<string>();
        
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerAvatar { get; set; }

        public string? SentimentLabel { get; set; }
        public decimal? SentimentScore { get; set; }
    }
}
