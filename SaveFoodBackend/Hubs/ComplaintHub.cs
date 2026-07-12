using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SaveFoodBackend.Hubs
{
    public class ComplaintHub : Hub
    {
        public async Task JoinComplaintGroup(string complaintId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Complaint_{complaintId}");
        }

        public async Task LeaveComplaintGroup(string complaintId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Complaint_{complaintId}");
        }
    }
}
