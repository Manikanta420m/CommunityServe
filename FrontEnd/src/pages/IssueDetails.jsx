import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getIssueById, voteIssue } from "../services/issueService";
import { createComment, deleteComment, getComments } from "../services/commentService";
import { getStatusHistory } from "../services/statusHistoryService";
import { getIssueFeedback, saveIssueFeedback } from "../services/feedbackService";

const IssueDetails = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [reopenRequested, setReopenRequested] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setCommentsLoading(true);
        setHistoryLoading(true);
        setFeedbackLoading(true);
        const [issueData, commentData, historyData, feedbackData] = await Promise.all([
          getIssueById(id),
          getComments(id),
          getStatusHistory(id),
          getIssueFeedback(id),
        ]);
        setIssue(issueData);
        setComments(commentData);
        setHistory(historyData);
        setFeedback(feedbackData);
        if (feedbackData) {
          setRating(feedbackData.rating);
          setFeedbackComment(feedbackData.comment || "");
          setReopenRequested(Boolean(feedbackData.reopenRequested));
          setReopenReason(feedbackData.reopenReason || "");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load issue");
      } finally {
        setLoading(false);
        setCommentsLoading(false);
        setHistoryLoading(false);
        setFeedbackLoading(false);
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

  const handleFeedback = async (event) => {
    event.preventDefault();
    if (reopenRequested && !reopenReason.trim()) {
      toast.error("Please explain why the issue needs another review");
      return;
    }

    try {
      setSubmittingFeedback(true);
      const saved = await saveIssueFeedback(id, {
        rating,
        comment: feedbackComment,
        reopenRequested,
        reopenReason,
      });
      setFeedback(saved);
      toast.success(reopenRequested ? "Feedback saved and review requested" : "Feedback saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save feedback");
    } finally {
      setSubmittingFeedback(false);
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
  const isOwner = currentUser?.id && issue.createdBy?._id && currentUser.id === issue.createdBy._id;
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

        <div className="assignment-panel">
          <p className="eyebrow">Authority assignment</p>
          <div className="assignment-summary">
            <span className="badge">{issue.department?.code || "Awaiting department"}</span>
            <span className="muted">{issue.department?.name || "No department assigned yet"}</span>
            <span className="muted">Officer: {issue.assignedTo?.name || "Not assigned"}</span>
            {issue.targetDate && <span className="muted">Target: {new Date(issue.targetDate).toLocaleDateString()}</span>}
          </div>
        </div>

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

        {issue.resolutionEvidence?.length > 0 && (
          <div className="evidence-section">
            <div className="section-heading"><h2>Resolution evidence</h2></div>
            <div className="image-preview-grid detail-images">
              {issue.resolutionEvidence.map((url) => (
                <a href={url} target="_blank" rel="noreferrer" key={url}>
                  <img src={url} alt="Resolution evidence" loading="lazy" />
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

      {isOwner && ["Resolved", "Closed"].includes(issue.status) && (
        <section className="detail-card feedback-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Resolution feedback</p>
              <h2>How was the resolution?</h2>
              <p className="muted">Rate the outcome and request another review when the issue is not fully fixed.</p>
            </div>
          </div>
          {feedbackLoading ? <p className="muted">Loading feedback...</p> : (
            <form className="feedback-form" onSubmit={handleFeedback}>
              <label>
                Rating
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
                </select>
              </label>
              <label>
                Satisfaction comment
                <textarea value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} maxLength={1000} rows={4} placeholder="Tell the team what went well or what could improve." />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={reopenRequested} onChange={(event) => setReopenRequested(event.target.checked)} />
                I need another review of this issue
              </label>
              {reopenRequested && (
                <label>
                  Reopen reason
                  <textarea value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} maxLength={1000} rows={3} placeholder="What still needs attention?" required />
                </label>
              )}
              {feedback && <p className="muted">Last submitted: {new Date(feedback.updatedAt).toLocaleString()}</p>}
              <button type="submit" disabled={submittingFeedback}>{submittingFeedback ? "Saving..." : "Save feedback"}</button>
            </form>
          )}
        </section>
      )}

      <section className="timeline-section">
        <div className="section-heading"><div><p className="eyebrow">Progress tracking</p><h2>Status history</h2></div></div>
        {historyLoading ? <p className="muted">Loading status history...</p> : history.length === 0 ? <p className="muted">No status history available yet.</p> : (
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
        <div className="section-heading"><div><p className="eyebrow">Community discussion</p><h2>Comments ({comments.length})</h2></div></div>
        <form className="comment-form" onSubmit={handleComment}>
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Share useful information, updates, or context..." maxLength={1000} rows={4} required />
          <div className="comment-form-footer"><span className="muted">{commentText.length}/1000</span><button type="submit" disabled={commenting || !commentText.trim()}>{commenting ? "Posting..." : "Add comment"}</button></div>
        </form>

        {commentsLoading ? <p className="muted">Loading comments...</p> : comments.length === 0 ? <div className="empty-state"><h3>No comments yet</h3><p>Be the first person to add useful context to this issue.</p></div> : (
          <div className="comments-list">
            {comments.map((comment) => {
              const canDelete = currentUser && (currentUser.role === "admin" || currentUser.id === comment.author?._id);
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
