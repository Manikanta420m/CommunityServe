import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getIssueById, voteIssue } from "../services/issueService";
import { createComment, deleteComment, getComments } from "../services/commentService";
import { getStatusHistory } from "../services/statusHistoryService";

const IssueDetails = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setCommentsLoading(true);
        setHistoryLoading(true);
        const [issueData, commentData, historyData] = await Promise.all([
          getIssueById(id),
          getComments(id),
          getStatusHistory(id),
        ]);
        setIssue(issueData);
        setComments(commentData);
        setHistory(historyData);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load issue");
      } finally {
        setLoading(false);
        setCommentsLoading(false);
        setHistoryLoading(false);
      }
    };

    load();
  }, [id]);

  const handleVote = async () => {
    try {
      setVoting(true);
      const data = await voteIssue(id);
      setIssue(data.issue);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update vote");
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) return;

    try {
      setCommenting(true);
      const comment = await createComment(id, content);
      setComments((current) => [comment, ...current]);
      setCommentText("");
      toast.success("Comment added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add comment");
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((current) => current.filter((comment) => comment._id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete comment");
    }
  };

  if (loading) return <main className="container"><p>Loading issue...</p></main>;

  if (!issue) {
    return (
      <main className="container empty-state">
        <h1>Issue not found</h1>
        <Link to="/">Back to dashboard</Link>
      </main>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const mapUrl = issue.coordinates
    ? `https://www.openstreetmap.org/?mlat=${issue.coordinates.latitude}&mlon=${issue.coordinates.longitude}#map=18/${issue.coordinates.latitude}/${issue.coordinates.longitude}`
    : null;

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Community issue</p>
          <h1>{issue.title}</h1>
          <p className="muted">Reported by {issue.createdBy?.name || "Community member"}</p>
        </div>
        <Link className="secondary-button" to="/">Back</Link>
      </div>

      <section className="detail-card">
        <div className="detail-badges">
          <span className={`badge status-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span>
          <span className="badge">{issue.category}</span>
          <span className="badge">{issue.priority} priority</span>
        </div>

        <p className="detail-description">{issue.description}</p>

        {issue.images?.length > 0 && (
          <div className="evidence-section">
            <div className="section-heading"><h2>Evidence</h2></div>
            <div className="image-preview-grid detail-images">
              {issue.images.map((url) => (
                <a href={url} target="_blank" rel="noreferrer" key={url}>
                  <img src={url} alt="Issue evidence" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        )}

        <dl className="detail-grid">
          <div><dt>Location</dt><dd>{issue.location}</dd></div>
          <div><dt>Votes</dt><dd>{issue.votes}</dd></div>
          <div><dt>Reported</dt><dd>{new Date(issue.createdAt).toLocaleString()}</dd></div>
          <div><dt>Last updated</dt><dd>{new Date(issue.updatedAt).toLocaleString()}</dd></div>
        </dl>

        {issue.coordinates && (
          <div className="location-card">
            <strong>GPS location captured</strong>
            <p className="muted">{issue.coordinates.latitude}, {issue.coordinates.longitude}</p>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="secondary-button">Open in OpenStreetMap</a>
          </div>
        )}

        <button type="button" onClick={handleVote} disabled={voting}>
          {voting ? "Updating..." : "Vote / Remove vote"}
        </button>
      </section>

      <section className="timeline-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Progress tracking</p>
            <h2>Status history</h2>
          </div>
        </div>
        {historyLoading ? (
          <p className="muted">Loading status history...</p>
        ) : history.length === 0 ? (
          <p className="muted">No status history available yet.</p>
        ) : (
          <div className="status-timeline">
            {history.map((entry, index) => (
              <div className="timeline-item" key={entry._id}>
                <span className={`timeline-dot ${index === history.length - 1 ? "active" : ""}`} />
                <div>
                  <strong>{entry.status}</strong>
                  <span className="muted">{new Date(entry.createdAt).toLocaleString()} · {entry.changedBy?.name || "CommunityServe staff"}</span>
                  {entry.note && <p>{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="comments-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community discussion</p>
            <h2>Comments ({comments.length})</h2>
          </div>
        </div>

        <form className="comment-form" onSubmit={handleComment}>
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Share useful information, updates, or context..." maxLength={1000} rows={4} required />
          <div className="comment-form-footer">
            <span className="muted">{commentText.length}/1000</span>
            <button type="submit" disabled={commenting || !commentText.trim()}>{commenting ? "Posting..." : "Add comment"}</button>
          </div>
        </form>

        {commentsLoading ? (
          <p className="muted">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="empty-state"><h3>No comments yet</h3><p>Be the first person to add useful context to this issue.</p></div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => {
              const canDelete = currentUser && (currentUser.role === "admin" || currentUser._id === comment.author?._id);
              return (
                <article className="comment-card" key={comment._id}>
                  <div className="comment-header">
                    <div><strong>{comment.author?.name || "Community member"}</strong><span className="muted">{new Date(comment.createdAt).toLocaleString()}</span></div>
                    {canDelete && <button type="button" className="danger-button" onClick={() => handleDeleteComment(comment._id)}>Delete</button>}
                  </div>
                  <p>{comment.content}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default IssueDetails;
